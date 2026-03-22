/**
 * Utility for making authenticated API requests with Clerk
 */

export const fetchWithClerkAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    // Clerk automatically includes session cookies, so we don't need to manually add headers
    credentials: 'same-origin',
  });
  
  return response;
};

// Wrapper for authenticated GET requests
export const getWithClerkAuth = (url: string, options: RequestInit = {}) => {
  return fetchWithClerkAuth(url, { ...options, method: 'GET' });
};

// Wrapper for authenticated POST requests
export const postWithClerkAuth = (url: string, data: any, options: RequestInit = {}) => {
  return fetchWithClerkAuth(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  });
};

// Wrapper for authenticated PUT requests
export const putWithClerkAuth = (url: string, data: any, options: RequestInit = {}) => {
  return fetchWithClerkAuth(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  });
};

// Wrapper for authenticated DELETE requests
export const deleteWithClerkAuth = (url: string, options: RequestInit = {}) => {
  return fetchWithClerkAuth(url, { ...options, method: 'DELETE' });
};
