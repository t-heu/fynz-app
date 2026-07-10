import { supabase } from '@/lib/supabase'
import { getInfoAssinatura } from '@/lib/utils'; // Seu utilitário existente
import { AssinaturaCache } from '../cache/assinatura-cache'
import { AssinaturaRepository } from '../repositories/assinatura.repository'

export const AssinaturaService = {
  async getAssinaturaUsuario() {
    // 1. Tenta pegar do cache primeiro
    const cached = AssinaturaCache.get()
    if (cached) {
      return {
        ...getInfoAssinatura(cached),
        assinatura: cached
      }
    }

    // 2. Se não tem cache, busca o usuário e depois no banco
    const { data: { user } } = await supabase.auth.getUser()
    
    const respostaPadrao = {
      plano: 'Plano Gratuito',
      statusPlano: 'Sem assinatura ativa',
      possuiAcesso: false,
      trialExpirou: false,
      assinatura: null,
    }

    if (!user) return respostaPadrao

    try {
      const data = await AssinaturaRepository.buscarPorUsuarioId(user.id)
      if (!data) return respostaPadrao

      // 3. Salva no cache para a próxima vez
      AssinaturaCache.set(data as any)

      return {
        ...getInfoAssinatura(data as any),
        assinatura: data,
      }
    } catch (error) {
      return respostaPadrao
    }
  },

  limparCache() {
    AssinaturaCache.clear()
  }
}