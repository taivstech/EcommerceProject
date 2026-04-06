

export function redirectToLoginIfNeeded(): void {
  if (typeof window === 'undefined') return
  
  const currentPath = window.location.pathname
  const authPages = ['/login', '/register']
  
  if (authPages.some(page => currentPath.startsWith(page))) {
    return
  }

  const returnUrl = currentPath !== '/' ? currentPath : undefined
  if (returnUrl) {
    sessionStorage.setItem('returnUrl', returnUrl)
  }

  window.location.href = '/login'
}

export function isAuthError(response: any, error?: Error): boolean {
  if (response?.status === 401) {
    return true
  }

  if (response?.code === 1006 || response?.code === 401) {
    return true
  }

  if (error?.message === 'UNAUTHENTICATED' || 
      error?.message?.includes('Unauthenticated') ||
      error?.message?.includes('unauthorized')) {
    return true
  }

  if (response?.message === 'Unauthenticated' || 
      response?.message?.toLowerCase().includes('unauthorized')) {
    return true
  }
  
  return false
}
