import { supabase } from '@/lib/supabase'

export const AssinaturaRepository = {
  async buscarPorUsuarioId(userId: string) {
    const { data, error } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      
    if (error) throw error
    return data
  }
}