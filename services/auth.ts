import { supabase } from '@/lib/supabase'

export async function podeEntrar(userId: string) {
  const { data } = await supabase
    .from('assinaturas')
    .select('status, trial_fim')
    .eq('id', userId)
    .single()

  const agora = new Date()

  const trialValido =
    data?.status === 'trialing' &&
    data.trial_fim &&
    new Date(data.trial_fim) > agora

  const expirou =
    data?.status === 'trialing' &&
    data.trial_fim &&
    new Date(data.trial_fim) <= agora

  if (expirou) {
    await supabase
      .from('assinaturas')
      .update({ status: 'inactive' })
      .eq('id', userId)
  }

  return (
    data?.status === 'active' ||
    data?.status === 'vitalicio' ||
    trialValido
  )
}
