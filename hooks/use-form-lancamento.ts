import { Tags } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { useFinance } from '../contexts/FinanceContext'
import { bancos } from '../lib/bancos'
import { CATEGORIA_ICONS } from '../lib/categoria-icons'
import { aplicarMascaraMoeda, dtISO, lerValorMoeda, processarSaldoConta } from '../lib/finance-utils'

type RepType = 'Unico' | 'Fixo' | 'Parcelado'
type RepFreq = 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual'
const FREQ_INC: Record<RepFreq, number> = { Mensal: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12 }

export function useFormLancamento(open: boolean, onClose: () => void, editandoId?: number | null) {
  const { dados, salvar } = useFinance()
  
  // Estados do Formulário
  const [tipo, setTipo] = useState<'Despesa' | 'Receita'>('Despesa')
  const [valorStr, setValorStr] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [fonte, setFonte] = useState<string>('')
  const [data, setData] = useState(dtISO())
  const [pago, setPago] = useState(false)
  const [isPagFatura, setIsPagFatura] = useState(false)
  const [repType, setRepType] = useState<RepType>('Unico')
  const [repFreq, setRepFreq] = useState<RepFreq>('Mensal')
  const [qtdParcelas, setQtdParcelas] = useState('2')
  const [editandoGrupoId, setEditandoGrupoId] = useState<number | undefined>()
  const [showSaldo, setShowSaldo] = useState(false)
  const [modalRepeticaoOpen, setModalRepeticaoOpen] = useState(false)

  // Listas Ordenadas
  const cats = useMemo(() => {
    return (dados.categorias || [])
      .filter((c: any) => c.tipo === tipo && c.id !== 'META' && c.id !== 'FATURA')
      .sort((a: any, b: any) => a.nome.localeCompare(b.nome))
  }, [dados.categorias, tipo])

  const contasOrd = useMemo(() => [...(dados.contas || [])].sort((a: any, b: any) => a.nome.localeCompare(b.nome)), [dados.contas])
  const cartoesOrd = useMemo(() => [...(dados.cartoes || [])].sort((a: any, b: any) => a.nome.localeCompare(b.nome)), [dados.cartoes])

  // Inicialização / Edição
  useEffect(() => {
    if (!open) return

    if (editandoId) {
      const l: any = (dados.lancamentos || []).find((x: any) => x.id === editandoId)
      if (!l) return
      
      const isPF = l.tipo === 'PagamentoFatura'
      setIsPagFatura(isPF)
      setTipo(isPF ? 'Despesa' : (l.tipo as 'Despesa' | 'Receita'))
      setValorStr(aplicarMascaraMoeda(Math.round(l.valor * 100).toString()))
      setDescricao(l.descricao || '')
      setCategoriaId(String(l.categoriaId))
      setFonte(l.fonte || '')
      setData(l.data || dtISO())
      setEditandoGrupoId(l.grupoId)
      setPago(l.pago ?? true)

      const matchParcela = (l.descricao || '').match(/\((\d+)\/(\d+)\)/)
      if (matchParcela) {
        setRepType('Parcelado')
        setQtdParcelas(matchParcela[2])
      } else if (l.grupoId) {
        setRepType('Fixo')
        setQtdParcelas('2')
      } else {
        setRepType('Unico')
        setQtdParcelas('2')
      }
      setRepFreq('Mensal')
    } else {
      setIsPagFatura(false)
      setTipo('Despesa')
      setValorStr('')
      setDescricao('')
      setData(dtISO())
      setPago(false)
      setRepType('Unico')
      setRepFreq('Mensal')
      setQtdParcelas('2')
      setEditandoGrupoId(undefined)
      
      setFonte(contasOrd[0] ? `C-${contasOrd[0].id}` : '')
      setCategoriaId(cats[0] ? String(cats[0].id) : '')
    }
  }, [open, editandoId])

  useEffect(() => {
    if (!editandoId && cats[0]) setCategoriaId(String(cats[0].id))
  }, [tipo])

  // Lógica de Salvar (Mantida idêntica à sua original, apenas isolada)
  function ajustarCompetenciaCartao(dataRef: Date, fechamento: number) {
    const d = new Date(dataRef)
    if (d.getDate() > fechamento) d.setMonth(d.getMonth() + 1)
    return d
  }

  function salvarLancamento() {
    if (lerValorMoeda(valorStr) <= 0 || !categoriaId) {
      Alert.alert('Aviso', 'Preencha o valor e a categoria!')
      return
    }
    if (editandoId && (editandoGrupoId || repType !== 'Unico')) {
      setModalRepeticaoOpen(true)
      return 
    }
    finalizarSalvar(false)
  }

  function finalizarSalvar(aplicarProximos: boolean) {
    const v = lerValorMoeda(valorStr)
    const isCartao = dados.cartoes.find((c: any) => `T-${c.id}` === fonte)
    const isConta = fonte.startsWith('C-')
    const idFonte = parseInt(fonte.substring(2))
    const novosDados = { ...dados, lancamentos: [...dados.lancamentos] }
    const finalTipo = isPagFatura ? 'PagamentoFatura' : tipo;

    const base: any = {
      tipo: finalTipo, valor: v, descricao, 
      categoriaId: isNaN(Number(categoriaId)) ? categoriaId : Number(categoriaId),
      fonte, data, pago, isCartao: !!isCartao
    }

    if (editandoId) {
      const lAntigo = novosDados.lancamentos.find((x: any) => x.id === editandoId)!
      if (aplicarProximos) {
        const gId = editandoGrupoId || Date.now()
        const futuros = novosDados.lancamentos.filter((x: any) => (x.grupoId === editandoGrupoId || x.id === editandoId) && new Date(x.data) >= new Date(lAntigo.data))
        futuros.forEach((x: any) => { if (x.pago && x.fonte?.startsWith('C-')) processarSaldoConta(novosDados, parseInt(x.fonte.substring(2)), x.valor, x.tipo, true) })
        novosDados.lancamentos = novosDados.lancamentos.filter((x: any) => !futuros.includes(x))

        if (repType !== 'Unico') {
          const qtd = repType === 'Parcelado' ? (parseInt(qtdParcelas) || 2) : 12
          const inc = FREQ_INC[repFreq]
          const descLimpa = descricao.replace(/\(\d+\/\d+\)/g, '').replace(' recurrence', '').trim()

          for (let i = 0; i < qtd; i++) {
            const cartao = dados.cartoes.find((c: any) => `T-${c.id}` === fonte)
            let dBase = new Date(data + 'T12:00:00')
            if (cartao) dBase = ajustarCompetenciaCartao(dBase, cartao.fechamento)
            const d = new Date(dBase)
            d.setMonth(d.getMonth() + i * inc)
            
            const isPago = i === 0 ? pago : false
            const dText = repType === 'Parcelado' ? ` (${i + 1}/${qtd})` : ' recurrence'
            novosDados.lancamentos.push({ ...base, id: i === 0 ? editandoId : Date.now() + i, grupoId: gId, valor: v, descricao: descLimpa + dText, data: d.toISOString().slice(0, 10), pago: isPago })
            if (isConta && isPago) processarSaldoConta(novosDados, idFonte, v, tipo, false)
          }
        } else {
          const descLimpa = descricao.replace(/\(\d+\/\d+\)/g, '').replace(' recurrence', '').trim()
          novosDados.lancamentos.push({ ...base, id: editandoId, grupoId: undefined, valor: v, descricao: descLimpa, pago: pago })
          if (isConta && pago) processarSaldoConta(novosDados, idFonte, v, tipo, false)
        }
      } else {
        if (lAntigo.pago && lAntigo.fonte?.startsWith('C-')) processarSaldoConta(novosDados, parseInt(lAntigo.fonte.substring(2)), lAntigo.valor, lAntigo.tipo, true)
        const idx = novosDados.lancamentos.findIndex((x: any) => x.id === editandoId)
        novosDados.lancamentos[idx] = { ...lAntigo, ...base, id: editandoId, pago: pago, grupoId: lAntigo.grupoId }
        if (pago && isConta) processarSaldoConta(novosDados, idFonte, v, tipo, false)
      }
    } else {
      const gId = Date.now()
      if (repType !== 'Unico') {
        const qtd = repType === 'Parcelado' ? (parseInt(qtdParcelas) || 2) : 12
        const vParc = repType === 'Parcelado' ? v / qtd : v
        const inc = FREQ_INC[repFreq]
        for (let i = 0; i < qtd; i++) {
          const cartao = dados.cartoes.find((c: any) => `T-${c.id}` === fonte)
          let dBase = new Date(data + 'T12:00:00')
          if (cartao) dBase = ajustarCompetenciaCartao(dBase, cartao.fechamento)
          const d = new Date(dBase)
          d.setMonth(d.getMonth() + i * inc)
          
          const isPago = i === 0 ? pago : false
          const dText = repType === 'Parcelado' ? ` (${i + 1}/${qtd})` : ' recurrence'
          novosDados.lancamentos.push({ ...base, id: Date.now() + i, grupoId: gId, valor: vParc, descricao: descricao + dText, data: d.toISOString().slice(0, 10), pago: isPago })
          if (isConta && isPago) processarSaldoConta(novosDados, idFonte, vParc, tipo, false)
        }
      } else {
        novosDados.lancamentos.push({ ...base, id: Date.now() })
        if (isConta && pago) processarSaldoConta(novosDados, idFonte, v, tipo, false)
      }
    }
    
    salvar(novosDados)
    setModalRepeticaoOpen(false) 
    onClose()
  }

  // Cálculos Derivados (UI)
  const isDespesa = tipo === 'Despesa'
  const corPrincipal = isDespesa ? '#EF4444' : '#22C55E'
  const categoriaAtual = cats.find((c: any) => String(c.id) === String(categoriaId))
  const IconeCat = CATEGORIA_ICONS[categoriaAtual?.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Tags

  const contaSelecionada = dados.contas.find((c: any) => `C-${c.id}` === String(fonte))
  const cartaoSelecionado = dados.cartoes.find((c: any) => `T-${c.id}` === String(fonte))
  const selecionado = contaSelecionada || cartaoSelecionado
  const bancoOrigem = bancos.find((b: any) => b.id === selecionado?.icone?.split('/').pop()?.replace('.png', ''))

  let saldoVisivelFonte = 0
  let labelSaldoFonte = 'Saldo disponível'
  if (fonte.startsWith('C-') && contaSelecionada) {
    saldoVisivelFonte = (contaSelecionada as any).saldo || 0
  } else if (fonte.startsWith('T-') && cartaoSelecionado) {
    const gastosPendentes = (dados.lancamentos || [])
      .filter((l: any) => (l.fonte === `T-${cartaoSelecionado.id}` || l.destinoCartao === cartaoSelecionado.id) && !l.pago && l.tipo !== 'PagamentoFatura')
      .reduce((acc: number, l: any) => acc + l.valor, 0)
    saldoVisivelFonte = ((cartaoSelecionado as any).limite || 0) - gastosPendentes
    labelSaldoFonte = 'Limite disponível'
  }

  const repTextResumo = repType === 'Unico' ? 'Não se repete' : repType === 'Fixo' ? `Fixo (${repFreq})` : `Parcelado em ${qtdParcelas}x`

  return {
    states: { tipo, valorStr, descricao, categoriaId, fonte, data, pago, isPagFatura, repType, repFreq, qtdParcelas, showSaldo, modalRepeticaoOpen },
    setters: { setTipo, setValorStr, setDescricao, setCategoriaId, setFonte, setData, setPago, setRepType, setRepFreq, setQtdParcelas, setShowSaldo, setModalRepeticaoOpen },
    computed: { cats, contasOrd, cartoesOrd, contaSelecionada, cartaoSelecionado, selecionado, bancoOrigem, saldoVisivelFonte, labelSaldoFonte, isDespesa, corPrincipal, categoriaAtual, IconeCat, repTextResumo },
    actions: { salvarLancamento, finalizarSalvar }
  }
}