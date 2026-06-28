import { supabase } from '@/lib/supabase'
import type { Assinatura } from '@/lib/types'
import { getInfoAssinatura } from '@/lib/utils'

export async function podeEntrar(userId: string) {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return false
  }

  const info = getInfoAssinatura(data as Assinatura)

  if (info.trialExpirou) {
    return false
  }

  return info.possuiAcesso
}
