export function clearSession(redirectTo = "/login") {
  localStorage.clear()
  sessionStorage.clear()
  window.location.href = redirectTo
}
