import { toast } from "react-toastify";
import api from './axios';

export const apiCall = async (url: string, method: 'get' | 'post' | 'put' | 'delete' | 'patch', data: unknown = null, config: Record<string, unknown> = {}) => {
  try {
    console.log('API Call:', method, url, data);
    console.log('Base URL:', api.defaults.baseURL);
    
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
    return { success: true, data: response };
  } catch (error: unknown) {
    const axiosError = error as { 
      response?: { 
        status?: number;
        data?: { 
          message?: string; 
          errors?: Record<string, string[]> 
        } 
      } 
    };
    
    // Handle 401/403 errors - logout user
    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
      return { success: false };
    }
    
    console.log(error, "API Call Error");
    const errors = axiosError?.response?.data?.errors;
    const message = axiosError?.response?.data?.message;

    if (errors && Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const firstErrorMessage = errors[firstKey][0];
      toast.error(firstErrorMessage);
    } else if (message) {
      toast.error(message);
    } else {
      toast.error("Something went wrong, please try again.");
    }
    return { success: false };
  }
};