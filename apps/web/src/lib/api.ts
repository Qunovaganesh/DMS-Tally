import { useAuthStore } from '../stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

async function request<T>(
  endpoint: string, 
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options
  
  const url = `${API_BASE_URL}${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  // Add auth header if required and available
  if (requireAuth) {
    const { tokens, clearAuth } = useAuthStore.getState()
    if (tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`
    }
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
  }

  try {
    const response = await fetch(url, config)
    
    // Handle 401 - clear auth and redirect to login
    if (response.status === 401 && requireAuth) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      throw new ApiError(401, 'Unauthorized')
    }

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Request failed', data)
    }

    return data.data || data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Network or other errors
    throw new ApiError(0, 'Network error or server unavailable')
  }
}

// HTTP methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

export { ApiError }