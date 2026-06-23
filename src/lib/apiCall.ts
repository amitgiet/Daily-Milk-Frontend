import { toast } from "react-toastify";
import axios from "axios";
import api from './axios';
import { isSystemOnline } from "./networkStatus";
import i18n from "@/i18n";

// Retry configuration for 500 errors
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const NETWORK_TOAST_COOLDOWN_MS = 8000;

let lastNetworkToastAt = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isAbortedRequest(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const err = error as { aborted?: boolean; code?: string; name?: string; message?: string };

  if (err.aborted) return true;
  if (axios.isCancel(error)) return true;

  const message = err.message?.toLowerCase() ?? "";

  return (
    err.code === "ERR_CANCELED" ||
    err.name === "CanceledError" ||
    message.includes("aborted") ||
    message.includes("ns_binding_aborted")
  );
}

function isNetworkFailure(error: {
  aborted?: boolean;
  response?: { status?: number };
  status?: number;
  message?: string;
}) {
  if (error.aborted || isAbortedRequest(error)) return false;

  const status = error.response?.status ?? error.status;

  if (status === 0) return true;

  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("network error") ||
    message.includes("timeout") ||
    message.includes("network request failed")
  );
}

function shouldNotifyNetworkFailure(method: string) {
  return method !== "get";
}

function showNetworkFailureToast() {
  const now = Date.now();
  if (now - lastNetworkToastAt < NETWORK_TOAST_COOLDOWN_MS) return;

  lastNetworkToastAt = now;
  toast.error(
    isSystemOnline()
      ? i18n.t("common.serverUnreachable")
      : i18n.t("common.noInternet"),
  );
}

// Health check function to test API connectivity
export const checkApiHealth = async () => {
  try {
    console.log('Checking API health...');
    const response = await api.get('/health');
    console.log('API Health Check Success:', response);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return { success: false, error };
  }
};

export const apiCall = async (
  url: string, 
  method: 'get' | 'post' | 'put' | 'delete' | 'patch', 
  data: unknown = null, 
  config: Record<string, unknown> = {},
  retryCount = 0
) => {
  if (!isSystemOnline()) {
    return { success: false, offline: true };
  }

  try {
    const isFormData = data instanceof FormData;

    // Build headers safely
    const finalHeaders = { ...(config.headers as Record<string, string>) };
    if (!isFormData && !finalHeaders["Content-Type"]) {
      finalHeaders["Content-Type"] = "application/json";
    }

    const requestConfig: Record<string, unknown> = {
      ...config,
      headers: finalHeaders,
    };

    if (isFormData) {
      delete (requestConfig.headers as Record<string, string>)["Content-Type"];
      requestConfig.transformRequest = [(body: unknown) => body];
    }

    const response =
      method === "get" || method === "delete"
        ? await api[method](url, requestConfig)
        : await api[method](url, data, requestConfig);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    if (isAbortedRequest(error)) {
      return { success: false, aborted: true };
    }

    const axiosError = error as { 
      aborted?: boolean;
      response?: { 
        status?: number;
        data?: { 
          message?: string; 
          errors?: Record<string, string[]> 
        } 
      };
      message?: string;
      status?: number;
      url?: string;
      method?: string;
    };

    if (axiosError.aborted || isAbortedRequest(axiosError)) {
      return { success: false, aborted: true };
    }
    
    // Handle 401/403 errors - logout user
    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
      return { success: false };
    }

    // Retry logic for 500 errors
    if (axiosError.response?.status === 500 && retryCount < MAX_RETRIES) {
      console.log(`Retrying API call due to 500 error. Attempt ${retryCount + 1}/${MAX_RETRIES}`);
      await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return apiCall(url, method, data, config, retryCount + 1);
    }
    
    // Log detailed error information
    console.error('API Call Error Details:', {
      url: axiosError.url || url,
      method: axiosError.method || method,
      status: axiosError.response?.status || axiosError.status,
      message: axiosError.response?.data?.message || axiosError.message,
      data: axiosError.response?.data,
      retryCount,
      timestamp: new Date().toISOString()
    });

    if (isNetworkFailure(axiosError)) {
      if (shouldNotifyNetworkFailure(method)) {
        showNetworkFailureToast();
      }

      return {
        success: false,
        networkError: true,
        offline: !isSystemOnline(),
        error: {
          status: axiosError.response?.status || axiosError.status || 0,
          message: axiosError.message,
          url: axiosError.url || url,
          method: axiosError.method || method,
        },
      };
    }

    const errors = axiosError?.response?.data?.errors;
    const message = axiosError?.response?.data?.message || axiosError.message;

    if (errors && Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const firstErrorMessage = errors[firstKey][0];
      toast.error(firstErrorMessage);
    } else if (message) {
      toast.error(message);
    } else {
      toast.error("Something went wrong, please try again.");
    }
    
    return { 
      success: false, 
      error: {
        status: axiosError.response?.status || axiosError.status,
        message: message,
        url: axiosError.url || url,
        method: axiosError.method || method
      }
    };
  }
};