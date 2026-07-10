import { supabase } from '@/lib/supabase'
import { Alert } from 'react-native'
import { UsuarioCache } from '../cache/usuario-cache'
import { UsuarioRepository } from '../repositories/usuario.repository'
import { AssinaturaService } from './assinatura.service'
import { AuthService } from './auth.service'

export const UsuarioService = {
  async getDadosUsuario() {
    const cached = UsuarioCache.get()
    if (cached) return cached;

    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    if (!user) return { id: '', nome: 'Usuário', avatarUrl: '', email: '' }

    const userFormatado = {
      id: user.id,
      nome: user.user_metadata?.name ?? 'Usuário',
      avatarUrl: user.user_metadata?.avatar_url ?? '',
      email: user.email ?? '',
    }

    UsuarioCache.set(userFormatado)
    return userFormatado
  },

  async obterUsuarioId() {
    const usuario = await this.getDadosUsuario()
    return usuario.id
  },

  async updateProfileName(fullName: string) {
    await UsuarioRepository.atualizarMetadados({ name: fullName })
    UsuarioCache.clear() // Invalida o cache após mudar o nome
  },

  async excluirConta() {
    try {
      const userId = await this.obterUsuarioId()
      if (!userId) throw new Error("Usuário não identificado.")

      const { assinatura } = await AssinaturaService.getAssinaturaUsuario()
      const temPlanoAtivo = assinatura && (assinatura.status === 'active' || assinatura.status === 'past_due' || assinatura.plano_ativo === 'vitalicio')

      if (temPlanoAtivo) {
        Alert.alert(
          'Atenção',
          'Você possui uma assinatura ativa. Para excluir sua conta, você deve cancelar sua assinatura no portal de pagamentos primeiro.',
          [{ text: 'Entendido', style: 'default' }]
        )
        return
      }

      Alert.alert(
        'Atenção',
        'Todos os dados da sua conta serão apagados e não poderão ser recuperados. Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Apagar',
            style: 'destructive',
            onPress: async () => {
              try {
                await UsuarioRepository.deletarContaApi(userId)
                await AuthService.logout(true)
              } catch (err: any) {
                Alert.alert('Erro', err.message || 'Erro ao excluir conta.')
              }
            }
          }
        ]
      )
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível verificar seu status.')
    }
  }
}