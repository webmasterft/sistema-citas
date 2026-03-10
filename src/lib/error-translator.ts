/**
 * Utility to translate Supabase and common technical error messages to Spanish.
 */
export function translateError(error: any): string {
  if (!error) return "";

  const message = typeof error === "string" ? error : error.message || "";
  const code = error.code || "";

  // Supabase RLS policies
  if (message.includes("row-level security policy")) {
    return "No tiene permisos para realizar esta acción o su sesión ha expirado.";
  }

  // Unique constraint violations
  if (message.includes("duplicate key value violates unique constraint")) {
    return "Ya existe un registro con esta información (ej: RUC o Cédula duplicada).";
  }

  // Mandatory fields
  if (message.includes("null value in column")) {
    return "Por favor, complete todos los campos obligatorios.";
  }

  // Foreign key violations
  if (message.includes("violates foreign key constraint")) {
    return "Error de referencia: el registro relacionado no existe.";
  }

  // Auth errors
  if (message.includes("Invalid login credentials")) {
    return "Credenciales de acceso inválidas.";
  }

  if (message.includes("User already registered")) {
    return "El usuario ya se encuentra registrado.";
  }

  // Connectivity issues
  if (message.includes("fetch")) {
    return "Error de conexión. Por favor, verifique su internet.";
  }

  // Default fallback
  return "Ocurrió un error inesperado al procesar su solicitud.";
}
