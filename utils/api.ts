/**
 * Utility for making authenticated API requests
 */

// Function to get the auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

// Base fetch function with authorization header
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If response is 401 Unauthorized, redirect to login
  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }
  
  return response;
};

// Wrapper for authenticated GET requests
export const getWithAuth = (url: string, options: RequestInit = {}) => {
  return fetchWithAuth(url, { ...options, method: 'GET' });
};

// Wrapper for authenticated POST requests
export const postWithAuth = (url: string, data: any, options: RequestInit = {}) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Wrapper for authenticated PUT requests
export const putWithAuth = (url: string, data: any, options: RequestInit = {}) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Wrapper for authenticated DELETE requests
export const deleteWithAuth = (url: string, options: RequestInit = {}) => {
  return fetchWithAuth(url, { ...options, method: 'DELETE' });
}; 