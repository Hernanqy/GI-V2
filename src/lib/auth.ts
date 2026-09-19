const DOMINIO_INTERNO = "usuarios.gi-cultura.app";

export function normalizarUsuario(valor: string) {
  return valor.trim().toLocaleLowerCase("es");
}

export function usuarioValido(usuario: string) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(usuario);
}

export function usuarioAEmail(usuario: string) {
  return `${normalizarUsuario(usuario)}@${DOMINIO_INTERNO}`;
}
