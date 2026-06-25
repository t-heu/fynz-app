import type { AuthError } from '@supabase/supabase-js'

export function traduzirErroAuth(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha inválidos.'

    case 'email_not_confirmed':
      return 'Confirme seu e-mail antes de entrar.'

    case 'user_already_exists':
      return 'Este e-mail já está cadastrado.'

    case 'same_password':
      return 'A nova senha deve ser diferente da atual.'

    case 'weak_password':
      return 'A senha é muito fraca.'

    case 'over_email_send_rate_limit':
      return 'Muitas solicitações. Aguarde alguns minutos e tente novamente.'

    case 'email_address_invalid':
      return 'E-mail inválido.'

    case 'signup_disabled':
      return 'O cadastro está temporariamente indisponível.'

    default:
      switch (error.message) {
        case 'Password should be at least 6 characters':
          return 'A senha deve ter pelo menos 6 caracteres.'

        case 'Email rate limit exceeded':
          return 'Muitas tentativas. Aguarde alguns minutos.'

        default:
          return error.message || 'Ocorreu um erro inesperado.'
      }
  }
}
