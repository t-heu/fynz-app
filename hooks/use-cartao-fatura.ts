import { useFinance } from '@/contexts/FinanceContext'
import { dtISO, lerValorMoeda, processarSaldoConta } from '@/lib/finance-utils'
import { useMemo, useState } from 'react'

export function useCartaoFatura(cartao: any) {
  const { dados, salvar } = useFinance()
  const now = new Date()
  
  const [mes, setMes] = useState(now.getMonth())
  const [ano, setAno] = useState(now.getFullYear())

  function navMes(dir: number) {
    let m = mes + dir, a = ano
    if (m < 0) { m = 11; a-- }
    if (m > 11) { m = 0; a++ }
    setMes(m); setAno(a)
  }

  const getMesAno = (data: string, diaFechamento: number, ignorarFechamento: boolean) => {
    if (!data) return { mes: -1, ano: -1 }
    const [anoStr, mesStr, diaStr] = data.split('-').map(Number)
    let mesCalculado = mesStr - 1
    let anoCalculado = anoStr
    
    if (!ignorarFechamento && diaStr >= diaFechamento) {
      mesCalculado += 1
      if (mesCalculado > 11) {
        mesCalculado = 0
        anoCalculado += 1
      }
    }
    return { mes: mesCalculado, ano: anoCalculado }
  }

  const gastos = useMemo(() => {
    if (!cartao) return [] 
    
    return (dados.lancamentos || []).filter((l: any) => {
      if (l.fonte !== 'T-' + cartao.id && l.destinoCartao != cartao.id) return false
      
      const isParcelado = /\(\d+\/\d+\)/.test(l.descricao || '')
      const isAntecipado = (l.descricao || '').includes('(Antecipado)')
      const isPagamentoRecebido = l.tipo === 'PagamentoFatura' && l.destinoCartao === cartao.id
      
      const dataRef = getMesAno(l.data, Number(cartao.fechamento), isParcelado || isPagamentoRecebido || isAntecipado)
      
      return dataRef.mes === mes && dataRef.ano === ano
    }).sort((a: any, b: any) => {
      const timeDiff = new Date(b.data).getTime() - new Date(a.data).getTime()
      if (timeDiff === 0) return b.id - a.id
      return timeDiff
    })
  }, [dados.lancamentos, cartao, mes, ano])

  const totalFatura = useMemo(() => 
    gastos.filter((l: any) => !(l.tipo === 'PagamentoFatura' && l.destinoCartao === cartao?.id)).reduce((t: number, l: any) => t + l.valor, 0)
  , [gastos, cartao])

  const despesasAbertas = useMemo(() => 
    gastos.filter((l: any) => !(l.tipo === 'PagamentoFatura' && l.destinoCartao === cartao?.id) && !l.pago)
  , [gastos, cartao])

  const temGastos = useMemo(() => {
    return gastos.filter((l: any) => l.tipo === 'Despesa' || (l.tipo === 'PagamentoFatura' && l.fonte === `T-${cartao?.id}`)).length > 0
  }, [gastos, cartao])

  const todosPagos = useMemo(() => {
    const despesas = gastos.filter((l: any) => l.tipo === 'Despesa' || (l.tipo === 'PagamentoFatura' && l.fonte === `T-${cartao?.id}`))
    return despesas.length > 0 && despesas.every((l: any) => l.pago === true)
  }, [gastos, cartao])

  const agrupado = useMemo(() => {
    const obj: Record<string, typeof gastos> = {}
    gastos.forEach((l: any) => {
      const dt = l.data || dtISO()
      if (!obj[dt]) obj[dt] = []
      obj[dt].push(l)
    })
    return obj
  }, [gastos])

  function executarPagamento(
    itensSelecionados: number[], 
    valorPersonalizado: string, 
    origemPagamento: string, 
    dataConfirmada: string, 
    isAntecipacao: boolean
  ) {
    const vFinal = lerValorMoeda(valorPersonalizado)
    if (itensSelecionados.length === 0 || vFinal <= 0 || !cartao) return false
    
    const novosDados = { ...dados, lancamentos: [...dados.lancamentos] }
    const pagamentoId = Date.now()
    const isConta = origemPagamento.startsWith('C-')
    
    if (isConta) {
      processarSaldoConta(novosDados, origemPagamento.replace('C-', ''), vFinal, 'Despesa')
    }
    
    novosDados.lancamentos.push({
      id: pagamentoId, 
      tipo: 'PagamentoFatura', 
      valor: vFinal,
      descricao: `Pagamento da Fatura: ${cartao.nome}`,
      categoriaId: 'FATURA', 
      fonte: origemPagamento, 
      destinoCartao: cartao.id, 
      data: dataConfirmada, 
      pago: isConta 
    })

    novosDados.lancamentos = novosDados.lancamentos.map((lanc: any) => {
      if (itensSelecionados.includes(lanc.id)) {
        if (isAntecipacao) {
          return { 
            ...lanc, 
            pago: true, 
            faturaPagamentoId: pagamentoId,
            data: dataConfirmada, 
            descricao: lanc.descricao?.includes('(Antecipado)') 
              ? lanc.descricao 
              : `${lanc.descricao || ''} (Antecipado)` 
          }
        }
        return { ...lanc, pago: true, faturaPagamentoId: pagamentoId }
      }
      return lanc
    })

    salvar(novosDados)
    return true // indica sucesso
  }

  return {
    mes, ano, navMes, now,
    gastos, despesasAbertas, totalFatura, temGastos, todosPagos, agrupado,
    executarPagamento
  }
}