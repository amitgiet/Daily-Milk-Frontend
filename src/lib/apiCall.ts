import { toast } from "react-toastify";
import axios from 'axios';

// Create axios instance with default config
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add language header for internationalization
    const language = localStorage.getItem('i18nextLng') || 'en';
    config.headers['Accept-Language'] = language;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiCall = async (url: string, method: 'get' | 'post' | 'put' | 'delete' | 'patch', data: any = null, config: any = {}) => {
  try {
    const isFormData = data instanceof FormData;

    // Build headers safely
    const finalHeaders = { ...config.headers };
    if (!isFormData && !finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    const response =
      method === "get" || method === "delete"
        ? await instance[method](url, config)
        : await instance[method](url, data, {
            ...config,
            headers: finalHeaders,
          });

    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response?.data?.message === "Unauthenticated.") {
      localStorage.clear();
      window.location.reload();
    }
    console.log(error, "API Call Error");
    const errors = error?.response?.data?.errors;
    const message = error?.response?.data?.message;

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

export default instance; 