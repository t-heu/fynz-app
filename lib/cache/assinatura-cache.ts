import type { Assinatura } from '../types'; // Ajuste o import conforme seu projeto

let cacheAssinatura: Assinatura | null = null;

export const AssinaturaCache = {
  get: () => cacheAssinatura,
  set: (dados: Assinatura) => { cacheAssinatura = dados },
  clear: () => { cacheAssinatura = null }
}