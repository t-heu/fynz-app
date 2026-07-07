import { Assinatura } from "@/lib/types"

const mensal = process.env.NEXT_PUBLIC_STRIPE_PLAN_MENSAL
const semestral = process.env.NEXT_PUBLIC_STRIPE_PLAN_SEMESTRAL
const anual = process.env.NEXT_PUBLIC_STRIPE_PLAN_ANUAL

function formatarData(data: string | null) {
  if (!data) return '--'

  return new Date(data).toLocaleDateString('pt-BR')
}

export function trialExpirou(assinatura: Assinatura) {
  return (
    assinatura.status === 'trialing' &&
    !!assinatura.trial_fim &&
    new Date(assinatura.trial_fim) <= new Date()
  )
}

export function possuiAcesso(assinatura: Assinatura) {
  if (assinatura.plano_ativo === 'vitalicio') {
    return true
  }

  if (assinatura.status === 'active') {
    return true
  }

  if (
    assinatura.status === 'trialing' &&
    assinatura.trial_fim &&
    new Date(assinatura.trial_fim) > new Date()
  ) {
    return true
  }

  return false
}

export function nomePlano(assinatura: Assinatura) {
  if (assinatura.plano_ativo === 'free') {
    return 'Plano Gratuito'
  }

  if (assinatura.plano_ativo === 'vitalicio') {
    return 'Plano Vitalício'
  }

  switch (assinatura.stripe_price_id) {
    case mensal:
      return 'Premium Mensal'

    case semestral:
      return 'Premium Semestral'

    case anual:
      return 'Premium Anual'

    default:
      return 'Plano Premium'
  }
}

export function descricaoPlano(assinatura: Assinatura) {
  switch (assinatura.status) {
    case 'active':
      return `Ativo até ${formatarData(assinatura.periodo_fim)}`

    case 'trialing':
      return `Teste grátis até ${formatarData(assinatura.trial_fim)}`

    case 'past_due':
      return 'Pagamento pendente'

    case 'canceled':
      return 'Assinatura cancelada'

    default:
      return 'Sem assinatura ativa'
  }
}

export function getInfoAssinatura(assinatura: Assinatura | any) {
  return {
    plano: nomePlano(assinatura),
    statusPlano: descricaoPlano(assinatura),
    possuiAcesso: possuiAcesso(assinatura),
    trialExpirou: trialExpirou(assinatura),
  }
}
