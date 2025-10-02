// Define the application roles and helper for extracting a role from
// query string values.  The AppRole type enumerates all valid roles
// in the system.  The getRoleFromQuery function accepts a
// URLSearchParams instance (or anything with a similar API) and
// returns the role requested via the `role` query parameter or a
// default if none was provided.

export type AppRole =
  | 'SOLICITANTE'
  | 'COMPRAS'
  | 'AUTORIZADOR'
  | 'ADMIN'

/**
 * Extract the requested role from the given query parameters.
 *
 * The frontend uses URLSearchParams to pass the current role to the
 * dashboard route.  Normalise the value to uppercase and fall back to
 * 'COMPRAS' when not provided.
 */
export function getRoleFromQuery(sp: URLSearchParams): AppRole {
  const r = (sp.get('role') || 'COMPRAS').toUpperCase() as AppRole
  return r
}