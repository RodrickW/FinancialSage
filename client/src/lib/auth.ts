// Authentication helper functions

/**
 * Checks if the user is currently authenticated
 * @returns Promise that resolves to true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/users/profile', {
      credentials: 'include',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

/**
 * Logs the user out
 * @returns Promise that resolves to true if logout successful, false otherwise
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'GET',
      credentials: 'include',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

/**
 * Redirect to login page
 */
export function redirectToLogin() {
  window.location.href = '/login';
}

/**
 * Redirect to dashboard page
 */
export function redirectToDashboard() {
  window.location.href = '/dashboard';
}