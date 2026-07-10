import { supabase } from '@/lib/supabase'

export const UsuarioRepository = {
  async atualizarMetadados(data: any) {
    const { error } = await supabase.auth.updateUser({ data })
    if (error) throw error
  },
  
  async deletarContaApi(userId: string) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://fynz.dev.br/'
    const res = await fetch(`${apiUrl}/api/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data
  }
}