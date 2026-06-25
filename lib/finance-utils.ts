import type { AppData, Categoria, Lancamento } from './types'

export function fm(valor: number | string | undefined): string {
  return (parseFloat(String(valor)) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function dtISO(): string {
  const t = new Date().getTimezoneOffset() * 60000
  return new Date(Date.now() - t).toISOString().slice(0, 10)
}

export function formatMesAno(data: Date): string {
  const meses = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ]

  return `${meses[data.getMonth()]} ${data.getFullYear()}`
}

export function aplicarMascaraMoeda(valor: string): string {
  let v = valor.replace(/\D/g, '')

  if (v === '') return ''

  const num = (parseInt(v) / 100).toFixed(2)

  return num
    .replace('.', ',')
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
}

export function lerValorMoeda(valor: string): number {
  if (!valor) return 0

  return (
    parseFloat(
      valor
        .replace(/\./g, '')
        .replace(',', '.')
    ) || 0
  )
}

export function calcularSaldoComprometidoCartao(
  dados: AppData,
  idCartao: number
): number {
  const despesas = (dados.lancamentos || []).filter(
    l =>
      l.fonte === `T-${idCartao}` &&
      l.tipo === 'Despesa' &&
      l.pago !== true
  )

  return despesas.reduce(
    (total, l) => total + Number(l.valor || 0),
    0
  )
}

export function recalcularDevedorCartao(
  dados: AppData,
  idCartao: number
): number {
  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  const faturaMes = (dados.lancamentos || []).filter(l => {
    if (
      l.fonte !== `T-${idCartao}` ||
      l.tipo !== 'Despesa' ||
      l.pago === true
    ) {
      return false
    }

    const [ano, mes] = l.data.split('-').map(Number)

    return (
      mes - 1 === mesAtual &&
      ano === anoAtual
    )
  })

  return faturaMes.reduce(
    (total, l) => total + Number(l.valor || 0),
    0
  )
}

export function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
}

export function validatePasswordStrength(password: string) {
  const temMaiuscula = /[A-Z]/.test(password)
  const temMinuscula = /[a-z]/.test(password)
  const temNumero = /[0-9]/.test(password)
  const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const tamanhoMinimo = password.length >= 8

  return (
    tamanhoMinimo &&
    temMaiuscula &&
    temMinuscula &&
    temNumero &&
    temEspecial
  )
}

export function getPasswordStrength(password: string) {
  let score = 0

  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  return score
}

export function processarSaldoConta(
  dados: AppData,
  id: number | string,
  val: number,
  tipo: string,
  estornar = false
): void {
  const conta = (dados.contas || []).find(
    x => x.id == id
  )

  if (!conta) return

  let multiplicador =
    tipo === 'Receita'
      ? 1
      : -1

  if (estornar) {
    multiplicador *= -1
  }

  conta.saldo =
    (parseFloat(String(conta.saldo)) || 0) +
    val * multiplicador
}

export function getCatFromLancamento(
  dados: AppData,
  l: Lancamento
): Categoria {
  return (
    (dados.categorias || []).find(
      x => x.id == l.categoriaId
    ) || {
      id: 0,
      nome: 'Sem categoria',
      tipo: 'Despesa',
      icone: '🏷️',
      cor: '#888'
    }
  )
}

export function getFonteName(
  dados: AppData,
  fonte: string
): string {
  if (!fonte) {
    return 'Excluído'
  }

  if (fonte.startsWith('C-')) {
    const conta = (dados.contas || []).find(
      x =>
        x.id ==
        parseInt(fonte.substring(2))
    )

    return conta
      ? conta.nome
      : 'Conta excluída'
  }

  if (fonte.startsWith('T-')) {
    const cartao = (dados.cartoes || []).find(
      x =>
        x.id ==
        parseInt(fonte.substring(2))
    )

    return cartao
      ? cartao.nome
      : 'Cartão excluído'
  }

  return 'Excluído'
}

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]
