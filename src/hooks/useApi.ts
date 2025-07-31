import React, { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    initialData?: T | null;
  }
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: options?.initialData || null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await apiFunction(...args);
        
        // Handle apiCall response format
        if (result && typeof result === 'object' && 'success' in result) {
          if (result.success) {
            const data = result.data || result;
            setState(prev => ({ ...prev, data, loading: false }));
            
            if (options?.onSuccess) {
              options.onSuccess(data);
            }
            
            return data;
          } else {
            const errorMessage = 'API call failed';
            setState(prev => ({ ...prev, error: errorMessage, loading: false }));
            
            if (options?.onError) {
              options.onError(errorMessage);
            }
            
            return null;
          }
        } else {
          // Handle direct API response
          setState(prev => ({ ...prev, data: result, loading: false }));
          
          if (options?.onSuccess) {
            options.onSuccess(result);
          }
          
          return result;
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'An error occurred';
        setState(prev => ({ ...prev, error: errorMessage, loading: false }));
        
        if (options?.onError) {
          options.onError(errorMessage);
        }
        
        return null;
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setState({
      data: options?.initialData || null,
      loading: false,
      error: null,
    });
  }, [options?.initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hooks for common API patterns
export function useMutation<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
) {
  return useApi(apiFunction, options);
}

export function useQuery<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    initialData?: T | null;
    autoExecute?: boolean;
    autoExecuteArgs?: any[];
  }
) {
  const api = useApi(apiFunction, options);

  // Auto-execute on mount if specified
  React.useEffect(() => {
    if (options?.autoExecute && !api.data && !api.loading) {
      api.execute(...(options.autoExecuteArgs || []));
    }
  }, []); // Only run on mount

  return api;
} 