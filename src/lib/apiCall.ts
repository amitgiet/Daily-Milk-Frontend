import { toast } from "react-toastify";
import api from './axios';

// Retry configuration for 500 errors
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  try {
    console.log('API Call:', method, url, data);
    console.log('Base URL:', api.defaults.baseURL);
    console.log('Retry attempt:', retryCount);
    
    const isFormData = data instanceof FormData;

    // Build headers safely
    const finalHeaders = { ...(config.headers as Record<string, string>) };
    if (!isFormData && !finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    const response =
      method === "get" || method === "delete"
        ? await api[method](url, config)
        : await api[method](url, data, {
            ...config,
            headers: finalHeaders,
          });

    console.log('API Response:', response);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const axiosError = error as { 
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