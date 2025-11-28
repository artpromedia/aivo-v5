/**
 * CSRF Client-Side Utilities
 * 
 * Provides client-side functions for working with CSRF tokens.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

/** Default CSRF cookie name */
const CSRF_COOKIE_NAME = 'csrf-token';

/** Default CSRF header name */
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Get CSRF token from cookie
 * 
 * @param cookieName - Name of the CSRF cookie (default: 'csrf-token')
 * @returns The CSRF token or null if not found
 */
export function getCSRFToken(cookieName: string = CSRF_COOKIE_NAME): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Check if a request method requires CSRF protection
 */
function requiresCSRF(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}

/**
 * Secure fetch wrapper that automatically includes CSRF token
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The fetch response
 * 
 * @example
 * ```typescript
 * const response = await secureFetch('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' }),
 * });
 * ```
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method || 'GET';
  const headers = new Headers(options.headers);

  // Add CSRF token for mutating requests
  if (requiresCSRF(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  // Ensure credentials are included for cookie access
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || 'same-origin',
  };

  const response = await fetch(url, fetchOptions);

  // Handle CSRF validation failure
  if (response.status === 403) {
    const data = await response.clone().json().catch(() => null);
    if (data?.error === 'CSRF_VALIDATION_FAILED') {
      // Try to refresh the CSRF token
      await refreshCSRFToken();
      
      // Retry the request with new token
      const newToken = getCSRFToken();
      if (newToken) {
        headers.set(CSRF_HEADER_NAME, newToken);
        return fetch(url, { ...fetchOptions, headers });
      }
    }
  }

  return response;
}

/**
 * Refresh CSRF token by calling the token endpoint
 */
export async function refreshCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.error('Failed to refresh CSRF token:', error);
  }

  return null;
}

/**
 * React hook for CSRF token
 * 
 * @returns The current CSRF token or null
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const csrfToken = useCSRFToken();
 *   
 *   const handleSubmit = async () => {
 *     await fetch('/api/data', {
 *       method: 'POST',
 *       headers: {
 *         'x-csrf-token': csrfToken || '',
 *       },
 *     });
 *   };
 * }
 * ```
 */
export function useCSRFToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get initial token
    const currentToken = getCSRFToken();
    setToken(currentToken);

    // If no token, try to get one
    if (!currentToken) {
      refreshCSRFToken().then(setToken);
    }
  }, []);

  return token;
}

/**
 * React hook for secure API calls with CSRF protection
 * 
 * @returns Object with secureFetch function and current token
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { fetch: secureFetch, token } = useSecureFetch();
 *   
 *   const handleSubmit = async () => {
 *     const response = await secureFetch('/api/data', {
 *       method: 'POST',
 *       body: JSON.stringify({ data: 'value' }),
 *     });
 *   };
 * }
 * ```
 */
export function useSecureFetch() {
  const token = useCSRFToken();

  const fetchWithCSRF = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      return secureFetch(url, options);
    },
    []
  );

  return {
    fetch: fetchWithCSRF,
    token,
    refreshToken: refreshCSRFToken,
  };
}

/**
 * Create headers object with CSRF token included
 * 
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object with CSRF token
 */
export function createSecureHeaders(
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  const csrfToken = getCSRFToken();
  
  return {
    'Content-Type': 'application/json',
    ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
    ...additionalHeaders,
  };
}

/**
 * Axios-style request interceptor for adding CSRF token
 * 
 * Use this with axios or similar HTTP clients:
 * 
 * @example
 * ```typescript
 * axios.interceptors.request.use(csrfRequestInterceptor);
 * ```
 */
export function csrfRequestInterceptor<T extends { headers?: Record<string, string>; method?: string }>(
  config: T
): T {
  const method = config.method?.toUpperCase() || 'GET';
  
  if (requiresCSRF(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers = {
        ...config.headers,
        [CSRF_HEADER_NAME]: csrfToken,
      };
    }
  }

  return config;
}
