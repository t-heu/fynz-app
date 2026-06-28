export interface Conta {
  id: number
  nome: string
  saldo: number
  icone: string
}

export interface Cartao {
  id: number
  nome: string
  icone: string
  limite: number
  fechamento: number
  vencimento: number
  contaPagamento: number
}

export interface Categoria {
  id: number | string
  nome: string
  tipo: 'Despesa' | 'Receita'
  icone: string
  cor: string
}

export interface Lancamento {
  id: number
  tipo: 'Despesa' | 'Receita' | 'PagamentoFatura'
  valor: number
  descricao: string
  categoriaId: number | string
  fonte: string
  data: string
  pago: boolean

  grupoId?: number

  repType?: 'Unico' | 'Fixo' | 'Parcelado'
  repFreq?: 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual'
  qtdParcelas?: number

  silencioso?: boolean
  destinoCartao?: number
  metaId?: number
  movimentoMeta?: 'Guardar' | 'Resgatar'

  isCartao?: any
}

export interface Meta {
  id: number
  nome: string
  objetivo: number
  depositado: number
  prazo: string
  contaId: number
}

export interface AppData {
  version: number
  lastModified: string
  
  contas: Conta[]
  cartoes: Cartao[]
  categorias: Categoria[]
  lancamentos: Lancamento[]
  metas: Meta[]
}

export type TabId = 'home' | 'lancamentos' | 'relatorios' | 'metas'
export type RepType = 'Unico' | 'Fixo' | 'Parcelado'
export type RepFreq = 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual'

// banco de dados

export interface Assinatura {
  atualizado_em: string;
  criado_em: string;
  id: string;
  periodo_fim: string | null;
  plano_ativo: "vitalicio" | "premium" | "free";
  status:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid"
    | "paused";
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  stripe_subscription_id: string | null;
  trial_fim: string | null;
  cancel_at: string | null;
}

export interface LoginProps {
  email: string
  senha: string
}

export interface RegisterProps {
  nome: string
  email: string
  senha: string
}
