import { validatePasswordStrength } from '@/lib/finance-utils'
import { supabase } from '@/lib/supabase'
import { traduzirErroAuth } from '@/lib/traduzir-erro-auth'
import { router } from 'expo-router'
import { AssinaturaCache } from '../cache/assinatura-cache'
import { UsuarioCache } from '../cache/usuario-cache'
import { clearStorage } from '../storage/db'
import type { LoginProps, RegisterProps } from '../types'

export const AuthService = {
  // ==========================================
  // LOGIN, REGISTRO E LOGOUT
  // ==========================================
  
  async login({ email, senha }: LoginProps) {
    UsuarioCache.clear()
    AssinaturaCache.clear()
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(traduzirErroAuth(error))
    return data
  },

  async register({ nome, email, senha }: RegisterProps) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { name: nome } },
    })
    if (error) throw new Error(traduzirErroAuth(error))
    return data
  },

  async logout(skipConfirmation = false) {
    if (skipConfirmation) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Limpa TODAS as camadas de dados locais
      await clearStorage()
      UsuarioCache.clear()
      AssinaturaCache.clear()
      
      router.replace('/login')
    } catch (error) {
      console.error('Erro ao realizar logout:', error)
      throw error
    }
  },

  // ==========================================
  // GERENCIAMENTO DE SENHAS
  // ==========================================

  async validateCurrentPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(traduzirErroAuth(error))
  },

  async updatePassword(senha: string) {
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) throw new Error(traduzirErroAuth(error))
  },

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    if (!validatePasswordStrength(newPassword)) {
      throw new Error('Mínimo de 8 caracteres, com maiúsculas, minúsculas, números e símbolos.')
    }

    if (newPassword !== confirmPassword) {
      throw new Error('A confirmação não confere.')
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) throw new Error('Usuário não encontrado.')

    // Valida a senha atual antes de trocar
    await this.validateCurrentPassword(user.email, currentPassword)
    await this.updatePassword(newPassword)
    
    return true
  },

  async resetPassword(email: string, redirectTo?: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || 'exp://localhost:8081/--/redefinir-senha', 
    })
    if (error) throw error
    return data
  }
}