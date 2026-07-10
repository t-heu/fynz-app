let cacheUsuario: any = null;

export const UsuarioCache = {
  get: () => cacheUsuario,
  set: (dados: any) => { cacheUsuario = dados },
  clear: () => { cacheUsuario = null }
}