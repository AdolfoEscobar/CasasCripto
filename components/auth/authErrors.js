// Copy en español para los códigos de error que NextAuth añade a la URL
// (?error=...) cuando un login falla. Fuente única para el modal
// (<SignInCard/>) y la página de errores (app/auth/error).
// (see https://authjs.dev/reference/core/types#signinpageerrorparam)
export const AUTH_ERROR_MESSAGES = {
  OAuthAccountNotLinked:
    "Ese correo ya está registrado con otro método de acceso. Prueba con el mismo método que usaste la primera vez.",
  EmailSignin:
    "No pudimos enviar el enlace de acceso. Verifica el correo e inténtalo de nuevo.",
  Verification:
    "El enlace de acceso venció o ya fue usado. Solicita uno nuevo.",
  AccessDenied: "No tienes permiso para acceder con esta cuenta.",
  CredentialsSignin:
    "No pudimos verificar tu firma. Reconecta tu wallet e inténtalo de nuevo.",
  Default: "Ocurrió un problema al iniciar sesión. Inténtalo de nuevo.",
};

export function getAuthErrorMessage(code) {
  return AUTH_ERROR_MESSAGES[code] || AUTH_ERROR_MESSAGES.Default;
}
