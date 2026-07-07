import { CalculadoraFinanceira } from '@/components/CalculadoraFinanceira'; // Ajuste o path conforme sua estrutura
import { APP_URL } from "@/constants/vars";
import { useFinance } from '@/contexts/FinanceContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { bancos } from '@/lib/bancos';
import { CATEGORIA_ICONS } from '@/lib/categoria-icons';
import { COLORS } from "@/lib/colors";
import { aplicarMascaraMoeda, dtISO, fm, lerValorMoeda, processarSaldoConta } from '@/lib/finance-utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowRightLeft, Calendar, Check, CheckCircle2, ChevronRight, Eye, EyeOff, Landmark, Plus, ReceiptText, Repeat, Sigma, Tags, WalletCards, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FormCategoria } from './FormCategoria'; // Ajuste o path conforme sua estrutura

interface Props {
  open: boolean
  onClose: () => void
  editandoId?: number | null
}

type RepType = 'Unico' | 'Fixo' | 'Parcelado'
type RepFreq = 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual'

const FREQS: RepFreq[] = ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual']
const FREQ_INC: Record<RepFreq, number> = { Mensal: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12 }

export function FormLancamento({ open, onClose, editandoId }: Props) {
  const { dados, salvar } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const [tipo, setTipo] = useState<'Despesa' | 'Receita'>('Despesa')
  const [valorStr, setValorStr] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [fonte, setFonte] = useState<string>('')
  const [data, setData] = useState(dtISO())
  const [showSaldo, setShowSaldo] = useState(false)
  const [pago, setPago] = useState(false) // 👉 Alterado: Agora vem desativado por padrão
  const [isPagFatura, setIsPagFatura] = useState(false) // 👉 NOVO: Estado para proteger o Pagamento da Fatura
  
  // Repetição
  const [repType, setRepType] = useState<RepType>('Unico')
  const [repFreq, setRepFreq] = useState<RepFreq>('Mensal')
  const [qtdParcelas, setQtdParcelas] = useState('2')
  
  // Modais e Drawers
  const [modalRepeticaoOpen, setModalRepeticaoOpen] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [editandoGrupoId, setEditandoGrupoId] = useState<number | undefined>()
  const [showFormCat, setShowFormCat] = useState(false)
  const [openDrawer, setOpenDrawer] = useState<'categoria' | 'fonte' | 'repeticao' | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Função para tratar a seleção da data
  const handleDateChange = (event: any, selectedDate: any) => {
    // No Android, o picker fecha sozinho ao selecionar, no iOS precisamos fechar
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      // Monta a data no formato YYYY-MM-DD
      const ano = selectedDate.getFullYear();
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      setData(`${ano}-${mes}-${dia}`);
    }

    // Se fechar ou cancelar (iOS), fecha o modal
    if (event.type === 'set' || event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  // Listas Ordenadas
  const cats = useMemo(() => {
    return (dados.categorias || [])
      .filter((c: any) => c.tipo === tipo && c.id !== 'META' && c.id !== 'FATURA')
      .sort((a: any, b: any) => a.nome.localeCompare(b.nome))
  }, [dados.categorias, tipo])

  const contasOrd = useMemo(() => {
    return [...(dados.contas || [])].sort((a: any, b: any) => a.nome.localeCompare(b.nome))
  }, [dados.contas])

  const cartoesOrd = useMemo(() => {
    return [...(dados.cartoes || [])].sort((a: any, b: any) => a.nome.localeCompare(b.nome))
  }, [dados.cartoes])

  useEffect(() => {
    if (!open) {
      setOpenDrawer(null)
      setShowCalc(false)
      return
    }

    if (editandoId) {
      const l: any = (dados.lancamentos || []).find((x: any) => x.id === editandoId)
      if (!l) return
      
      // 👉 NOVO: Identifica se é fatura e ajusta o tipo
      const isPF = l.tipo === 'PagamentoFatura'
      setIsPagFatura(isPF)
      setTipo(isPF ? 'Despesa' : (l.tipo as 'Despesa' | 'Receita'))
      
      setValorStr(formatValor(l.valor))
      setDescricao(l.descricao || '')
      setCategoriaId(String(l.categoriaId))
      setFonte(l.fonte || '')
      setData(l.data || dtISO())
      setEditandoGrupoId(l.grupoId)
      setPago(l.pago ?? true) // Mantém o status original se estiver editando

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
      // 👉 NOVO: Reseta tudo corretamente para lançamentos novos
      setIsPagFatura(false)
      setTipo('Despesa')
      setValorStr('')
      setDescricao('')
      setData(dtISO())
      setPago(false) // 👉 Desativado para novos lançamentos
      setRepType('Unico')
      setRepFreq('Mensal')
      setQtdParcelas('2')
      setEditandoGrupoId(undefined)
      
      const primeiraConta = contasOrd[0]
      setFonte(primeiraConta ? `C-${primeiraConta.id}` : '')
      const primeiraCat = cats[0]
      setCategoriaId(primeiraCat ? String(primeiraCat.id) : '')
    }
  }, [open, editandoId])

  useEffect(() => {
    if (!editandoId) {
      const primeiraCat = cats[0]
      if (primeiraCat) setCategoriaId(String(primeiraCat.id))
    }
  }, [tipo])

  function formatValor(v: number): string {
    return aplicarMascaraMoeda(Math.round(v * 100).toString())
  }

  function handleCatSaved(cat: any) {
    setCategoriaId(String(cat.id))
    setShowFormCat(false)
  }

  function ajustarCompetenciaCartao(dataRef: Date, fechamento: number) {
    const d = new Date(dataRef)
    const dia = d.getDate()
    if (dia > fechamento) d.setMonth(d.getMonth() + 1)
    return d
  }

  function salvarLancamento() {
    const v = lerValorMoeda(valorStr)
    if (v <= 0 || !categoriaId) {
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
      tipo: finalTipo, // Usa o finalTipo em vez de tipo
      valor: v, descricao, 
      categoriaId: isNaN(Number(categoriaId)) ? categoriaId : Number(categoriaId),
      fonte, data, pago, isCartao: !!isCartao
    }

    if (editandoId) {
      const lAntigo = novosDados.lancamentos.find((x: any) => x.id === editandoId)!

      if (aplicarProximos) {
        const gId = editandoGrupoId || Date.now()
        const futuros = novosDados.lancamentos.filter((x: any) => (x.grupoId === editandoGrupoId || x.id === editandoId) && new Date(x.data) >= new Date(lAntigo.data))
        futuros.forEach((x: any) => {
          if (x.pago && x.fonte?.startsWith('C-')) processarSaldoConta(novosDados, parseInt(x.fonte.substring(2)), x.valor, x.tipo, true)
        })
        novosDados.lancamentos = novosDados.lancamentos.filter((x: any) => !futuros.includes(x))

        if (repType !== 'Unico') {
          const qtd = repType === 'Parcelado' ? (parseInt(qtdParcelas) || 2) : 12
          const inc = FREQ_INC[repFreq]
          const descLimpa = descricao.replace(/\(\d+\/\d+\)/g, '').replace(' recurrence', '').trim()

          for (let i = 0; i < qtd; i++) {
            const cartao = dados.cartoes.find((c: any) => `T-${c.id}` === fonte)
            const baseDate = new Date(data + 'T12:00:00')
            let dBase = baseDate
            if (cartao) dBase = ajustarCompetenciaCartao(baseDate, cartao.fechamento)

            const d = new Date(dBase)
            d.setMonth(d.getMonth() + i * inc)
            
            const isPago = i === 0 ? pago : false
            const dText = repType === 'Parcelado' ? ` (${i + 1}/${qtd})` : ' recurrence'
            
            const lParc: any = { 
              ...base, id: i === 0 ? editandoId : Date.now() + i, 
              grupoId: gId, valor: v, descricao: descLimpa + dText, 
              data: d.toISOString().slice(0, 10), pago: isPago 
            }
            novosDados.lancamentos.push(lParc)
            if (isConta && isPago) processarSaldoConta(novosDados, idFonte, v, tipo, false)
          }
        } else {
          const descLimpa = descricao.replace(/\(\d+\/\d+\)/g, '').replace(' recurrence', '').trim()
          const lUnico: any = { ...base, id: editandoId, grupoId: undefined, valor: v, descricao: descLimpa, pago: pago }
          novosDados.lancamentos.push(lUnico)
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
          const baseDate = new Date(data + 'T12:00:00')
          let dBase = baseDate
          if (cartao) dBase = ajustarCompetenciaCartao(baseDate, cartao.fechamento)

          const d = new Date(dBase)
          d.setMonth(d.getMonth() + i * inc)
          const isPago = i === 0 ? pago : false
          const dText = repType === 'Parcelado' ? ` (${i + 1}/${qtd})` : ' recurrence'
          const lParc: any = { ...base, id: Date.now() + i, grupoId: gId, valor: vParc, descricao: descricao + dText, data: d.toISOString().slice(0, 10), pago: isPago }
          novosDados.lancamentos.push(lParc)
          if (isConta && isPago) processarSaldoConta(novosDados, idFonte, vParc, tipo, false)
        }
      } else {
        const l: any = { ...base, id: Date.now() }
        novosDados.lancamentos.push(l)
        if (isConta && pago) processarSaldoConta(novosDados, idFonte, v, tipo, false)
      }
    }
    
    salvar(novosDados)
    setModalRepeticaoOpen(false) 
    onClose()
  }

  const isDespesa = tipo === 'Despesa'
  const corPrincipal = isDespesa ? '#EF4444' : '#22C55E'

  const categoriaAtual = cats.find((c: any) => String(c.id) === String(categoriaId))
  const IconeCat = CATEGORIA_ICONS[categoriaAtual?.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Tags

  const contaSelecionada = dados.contas.find((c: any) => `C-${c.id}` === String(fonte))
  const cartaoSelecionado = dados.cartoes.find((c: any) => `T-${c.id}` === String(fonte))
  const selecionado = contaSelecionada || cartaoSelecionado
  const bancoOrigem = bancos.find((b: any) => b.id === selecionado?.icone?.split('/').pop()?.replace('.png', ''))

  // 👉 LÓGICA DE SALDO/LIMITE RESTAURADA
  const isContaFonte = fonte.startsWith('C-')
  const isCartaoFonte = fonte.startsWith('T-')
  let saldoVisivelFonte = 0
  let labelSaldoFonte = 'Saldo disponível'

  if (isContaFonte && contaSelecionada) {
    saldoVisivelFonte = (contaSelecionada as any).saldo || 0
  } else if (isCartaoFonte && cartaoSelecionado) {
    const limiteBase = (cartaoSelecionado as any).limite || 0
    const gastosPendentes = (dados.lancamentos || [])
      .filter((l: any) => (l.fonte === `T-${cartaoSelecionado.id}` || l.destinoCartao === cartaoSelecionado.id) && !l.pago && l.tipo !== 'PagamentoFatura')
      .reduce((acc: number, l: any) => acc + l.valor, 0)
    saldoVisivelFonte = limiteBase - gastosPendentes
    labelSaldoFonte = 'Limite disponível'
  }

  const repTextResumo = repType === 'Unico' ? 'Não se repete' : repType === 'Fixo' ? `Fixo (${repFreq})` : `Parcelado em ${qtdParcelas}x`

  return (
    <>
      <Modal presentationStyle="pageSheet" visible={open} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={currentTheme.foreground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{editandoId ? "Editar Lançamento" : "Novo Lançamento"}</Text>
            <TouchableOpacity onPress={salvarLancamento} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {/* HERO COM GRADIENTE/BACKGROUND ADAPTATIVO */}
            <View style={[styles.heroSection, { backgroundColor: isDespesa ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)' }]}>
              
              {/* SELETOR TIPO */}
              <View style={[styles.typeSelectorContainer, isPagFatura && { opacity: 0.5 }]}>
                <TouchableOpacity 
                  disabled={isPagFatura}
                  onPress={() => setTipo('Despesa')} 
                  style={[styles.typeBtn, isDespesa && { backgroundColor: '#EF4444' }]}
                >
                  <Text style={[styles.typeBtnText, isDespesa ? { color: '#fff' } : { color: currentTheme.mutedForeground }]}>Saída</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  disabled={isPagFatura}
                  onPress={() => setTipo('Receita')} 
                  style={[styles.typeBtn, !isDespesa && { backgroundColor: '#22C55E' }]}
                >
                  <Text style={[styles.typeBtnText, !isDespesa ? { color: '#fff' } : { color: currentTheme.mutedForeground }]}>Entrada</Text>
                </TouchableOpacity>
              </View>

              {/* INPUT VALOR */}
              <View style={styles.amountInputRow}>
                <Text style={[styles.currencyPrefix, { color: corPrincipal }]}>R$</Text>
                <TextInput
                  value={valorStr}
                  onChangeText={text => setValorStr(aplicarMascaraMoeda(text))}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor="rgba(128,128,128,0.4)"
                  style={[styles.amountInput, { color: corPrincipal }]}
                />
                <TouchableOpacity
                  onPress={() => setShowCalc(v => !v)}
                  style={[styles.calcToggleBtn, showCalc ? { backgroundColor: currentTheme.card, borderColor: currentTheme.primary, borderWidth: 2 } : { backgroundColor: currentTheme.primary }]}
                >
                  <Sigma size={20} color={showCalc ? currentTheme.primary : '#fff'} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* INPUT DESCRIÇÃO */}
              <View style={styles.descInputContainer}>
                <ReceiptText size={20} color={corPrincipal} style={{ marginRight: 12, opacity: 0.6 }} />
                <TextInput
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="No que você gastou?"
                  placeholderTextColor={currentTheme.mutedForeground}
                  style={styles.descTextInput}
                  multiline={true}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* SEÇÃO DA CALCULADORA EMBUTIDA */}
            {showCalc && (
              <View style={styles.calcWrapper}>
                <CalculadoraFinanceira onApply={(valor) => setValorStr(aplicarMascaraMoeda(Math.round(valor * 100).toString()))} />
              </View>
            )}

            {/* FORMULÁRIO PRINCIPAL */}
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <View style={styles.cardFormContainer}>
                
                {/* SELEÇÃO CATEGORIA */}
                <TouchableOpacity onPress={() => setOpenDrawer('categoria')} style={styles.formRowItem}>
                  <View style={styles.rowItemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: categoriaAtual ? `${categoriaAtual.cor}20` : currentTheme.border }]}>
                      <IconeCat size={20} color={categoriaAtual?.cor || currentTheme.mutedForeground} />
                    </View>
                    <Text style={styles.rowItemLabel}>Categoria</Text>
                  </View>
                  <View style={styles.rowItemRight}>
                    <Text numberOfLines={1} style={[styles.rowItemValue, categoriaAtual && { color: currentTheme.primary }]}>
                      {categoriaAtual ? categoriaAtual.nome : 'Selecionar'}
                    </Text>
                    <ChevronRight size={18} color={currentTheme.mutedForeground} />
                  </View>
                </TouchableOpacity>

                {/* SELEÇÃO ORIGEM / SAIRÁ DE COM SALDO */}
                <View style={{ borderBottomWidth: 1, borderColor: currentTheme.border }}>
                  <TouchableOpacity onPress={() => setOpenDrawer('fonte')} style={[styles.formRowItem, { borderBottomWidth: 0 }]}>
                    <View style={styles.rowItemLeft}>
                      <View style={[styles.iconBox, { backgroundColor: '#FFF', borderWidth: 1, borderColor: currentTheme.border }]}>
                        {bancoOrigem ? <Image source={{ uri: APP_URL + bancoOrigem.logo }} style={{ width: 22, height: 22 }} resizeMode="contain" /> : <WalletCards size={20} color={currentTheme.mutedForeground} />}
                      </View>
                      <Text style={styles.rowItemLabel}>Sairá de</Text>
                    </View>
                    <View style={styles.rowItemRight}>
                      <Text numberOfLines={1} style={[styles.rowItemValue, selecionado && { color: currentTheme.primary }]}>
                        {selecionado ? selecionado.nome : 'Selecionar'}
                      </Text>
                      <ChevronRight size={18} color={currentTheme.mutedForeground} />
                    </View>
                  </TouchableOpacity>

                  {/* VISUALIZAÇÃO DO SALDO/LIMITE */}
                  {selecionado && (
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>{labelSaldoFonte}</Text>
                      <View style={styles.balanceValueContainer}>
                        <Text style={styles.balanceValueText}>
                          {showSaldo ? `R$ ${fm(saldoVisivelFonte)}` : 'R$ •••••'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowSaldo(!showSaldo)} style={{ padding: 4 }}>
                          {showSaldo ? <Eye size={16} color={currentTheme.mutedForeground} /> : <EyeOff size={16} color={currentTheme.mutedForeground} />}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* INPUT DATA FORMATADA COM CALENDÁRIO */}
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.formRowItem}>
                  <View style={styles.rowItemLeft}>
                    <View style={styles.iconBox}>
                      <Calendar size={20} color={currentTheme.foreground} />
                    </View>
                    <Text style={styles.rowItemLabel}>Data</Text>
                  </View>
                  <View style={styles.rowItemRight}>
                    <Text style={[styles.dateInputText, { color: currentTheme.primary }]}>
                      {data || "Selecionar data"}
                    </Text>
                    <ChevronRight size={18} color={currentTheme.mutedForeground} />
                  </View>
                </TouchableOpacity>

                {/* MODAL NATIVO DO CALENDÁRIO */}
                {showDatePicker && (
                  <DateTimePicker
                    value={data ? new Date(data + 'T12:00:00') : new Date()} // T12 previne problemas de fuso horário
                    mode="date"
                    display="default" // No iOS você pode usar "spinner" ou "inline" se preferir
                    onChange={handleDateChange}
                  />
                )}

                {/* CONFIGURAÇÃO REPETIÇÃO */}
                <TouchableOpacity onPress={() => setOpenDrawer('repeticao')} style={styles.formRowItem}>
                  <View style={styles.rowItemLeft}>
                    <View style={styles.iconBox}>
                      <Repeat size={20} color={currentTheme.foreground} />
                    </View>
                    <Text style={styles.rowItemLabel}>Repetição</Text>
                  </View>
                  <View style={styles.rowItemRight}>
                    <Text numberOfLines={1} style={[styles.rowItemValue, repType !== 'Unico' && { color: currentTheme.primary }]}>
                      {repTextResumo}
                    </Text>
                    <ChevronRight size={18} color={currentTheme.mutedForeground} />
                  </View>
                </TouchableOpacity>

                {/* SWITCH STATUS DE REGISTRO */}
                <View style={[styles.formRowItem, { borderBottomWidth: 0 }, isPagFatura && { opacity: 0.5 }]}>
                  <View style={styles.rowItemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: pago ? `${corPrincipal}20` : currentTheme.border }]}>
                      <CheckCircle2 size={20} color={pago ? corPrincipal : currentTheme.mutedForeground} />
                    </View>
                    <View>
                      <Text style={styles.rowItemLabel}>Status do Registro</Text>
                      <Text style={[styles.statusSubLabel, { color: pago ? corPrincipal : currentTheme.mutedForeground }]}>
                        {pago ? 'Liquidado' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    disabled={isPagFatura} // 👉 Bloqueia interação se for fatura
                    value={pago}
                    onValueChange={setPago}
                    trackColor={{ false: currentTheme.border, true: corPrincipal }}
                    thumbColor="#fff"
                  />
                </View>

              </View>
            </View>
          </ScrollView>
        </View>

        {/* SUBSHEETS MODAIS EM SUBSTITUIÇÃO AOS DRAWERS DA WEB */}
        {openDrawer !== null && (
          <View style={StyleSheet.absoluteFillObject}>
            <View style={styles.drawerOverlay}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setOpenDrawer(null)} />
              <View style={styles.drawerContentContainer}>
                
                <View style={styles.drawerIndicatorRow}>
                  <View style={styles.drawerIndicator} />
                </View>

                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>
                    {openDrawer === 'categoria' ? 'Selecione a Categoria' : openDrawer === 'fonte' ? 'Qual a Origem?' : 'Configurar Repetição'}
                  </Text>
                  <TouchableOpacity onPress={() => setOpenDrawer(null)} style={styles.drawerCloseIcon}>
                    <X size={18} color={currentTheme.foreground} />
                  </TouchableOpacity>
                </View>

                {/* SELETOR DRAWER - CATEGORIAS */}
                {openDrawer === 'categoria' && (
                  <ScrollView style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                    <TouchableOpacity 
                      onPress={() => { setOpenDrawer(null); setShowFormCat(true) }}
                      style={styles.drawerCreateBtn}
                    >
                      <Plus size={18} color="#fff" />
                      <Text style={styles.drawerCreateBtnText}>Criar Nova Categoria</Text>
                    </TouchableOpacity>
                    
                    {cats.length === 0 ? (
                      <Text style={styles.emptyText}>Nenhuma categoria encontrada.</Text>
                    ) : (
                      <View style={{ gap: 8 }}>
                        {cats.map((c: any) => {
                          const CatIcon = CATEGORIA_ICONS[c.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Tags
                          const isSelected = String(c.id) === categoriaId
                          return (
                            <TouchableOpacity 
                              key={c.id} 
                              onPress={() => { setCategoriaId(String(c.id)); setOpenDrawer(null) }}
                              style={[styles.drawerItemCard, isSelected && { borderColor: currentTheme.primary, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }]}
                            >
                              <View style={[styles.iconBox, { backgroundColor: `${c.cor}20` }]}>
                                <CatIcon size={20} color={c.cor} />
                              </View>
                              <Text style={styles.drawerItemText}>{c.nome}</Text>
                              {isSelected && <Check size={20} color={currentTheme.primary} />}
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    )}
                  </ScrollView>
                )}

                {/* SELETOR DRAWER - FONTE ORIGEM */}
                {openDrawer === 'fonte' && (
                  <ScrollView style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                    {contasOrd.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={styles.drawerSectionHeader}>Contas Bancárias</Text>
                        <View style={{ gap: 8 }}>
                          {contasOrd.map((c: any) => {
                            const isSelected = `C-${c.id}` === fonte
                            const banco = bancos.find((b: any) => b.id === c.icone?.split('/').pop()?.replace('.png', ''))
                            return (
                              <TouchableOpacity 
                                key={`C-${c.id}`} 
                                onPress={() => { setFonte(`C-${c.id}`); setOpenDrawer(null) }}
                                style={[styles.drawerItemCard, isSelected && { borderColor: currentTheme.primary }]}
                              >
                                <View style={[styles.iconBox, { backgroundColor: '#FFF', borderWidth: 1, borderColor: currentTheme.border }]}>
                                  {banco ? <Image source={{ uri: APP_URL + banco.logo }} style={{ width: 24, height: 24 }} /> : <Landmark size={20} color="#a1a1aa" />}
                                </View>
                                <Text style={styles.drawerItemText}>{c.nome}</Text>
                                {isSelected && <Check size={20} color={currentTheme.primary} />}
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </View>
                    )}
                    
                    {cartoesOrd.length > 0 && (
                      <View>
                        <Text style={styles.drawerSectionHeader}>Cartões de Crédito</Text>
                        <View style={{ gap: 8 }}>
                          {cartoesOrd.map((c: any) => {
                            const isSelected = `T-${c.id}` === fonte
                            const banco = bancos.find((b: any) => b.id === c.icone?.split('/').pop()?.replace('.png', ''))
                            return (
                              <TouchableOpacity 
                                key={`T-${c.id}`} 
                                onPress={() => { setFonte(`T-${c.id}`); setOpenDrawer(null) }}
                                style={[styles.drawerItemCard, isSelected && { borderColor: currentTheme.primary }]}
                              >
                                <View style={[styles.iconBox, { backgroundColor: '#FFF', borderWidth: 1, borderColor: currentTheme.border }]}>
                                  {banco ? <Image source={{ uri: APP_URL + banco.logo }} style={{ width: 24, height: 24 }} /> : <WalletCards size={20} color="#a1a1aa" />}
                                </View>
                                <Text style={styles.drawerItemText}>{c.nome}</Text>
                                {isSelected && <Check size={20} color={currentTheme.primary} />}
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </View>
                    )}
                  </ScrollView>
                )}

                {/* SELETOR DRAWER - REPETIÇÃO */}
                {openDrawer === 'repeticao' && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
                    <View style={styles.repTabsBox}>
                      {(['Unico', 'Fixo', 'Parcelado'] as const).map(t => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setRepType(t)}
                          style={[styles.repTabBtn, repType === t && { backgroundColor: currentTheme.primary }]}
                        >
                          <Text style={[styles.repTabBtnText, repType === t ? { color: '#fff' } : { color: currentTheme.mutedForeground }]}>
                            {t === 'Unico' ? 'Não Repetir' : t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {repType !== 'Unico' && (
                      <View style={{ gap: 16 }}>
                        <View>
                          <Text style={styles.drawerSectionHeader}>Frequência da Repetição</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                            {FREQS.map(f => (
                              <TouchableOpacity
                                key={f}
                                onPress={() => setRepFreq(f)}
                                style={[styles.freqBubble, repFreq === f && { borderColor: currentTheme.primary, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }]}
                              >
                                <Text style={[styles.freqBubbleText, { color: repFreq === f ? currentTheme.primary : currentTheme.foreground }]}>{f}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        {repType === 'Parcelado' && (
                          <View>
                            <Text style={styles.drawerSectionHeader}>Quantidade de Parcelas</Text>
                            <ScrollView contentContainerStyle={styles.parcelasGrid} style={{ maxHeight: 160 }}>
                              {Array.from({ length: 48 }, (_, i) => i + 1).map(p => {
                                const isSelected = String(p) === qtdParcelas
                                return (
                                  <TouchableOpacity
                                    key={p}
                                    onPress={() => setQtdParcelas(String(p))}
                                    style={[styles.parcelaGridItem, isSelected ? { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary } : { backgroundColor: currentTheme.border, borderColor: 'transparent' }]}
                                  >
                                    <Text style={[styles.parcelaGridItemText, isSelected ? { color: '#fff' } : { color: currentTheme.foreground }]}>{p}x</Text>
                                  </TouchableOpacity>
                                )
                              })}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    )}

                    <TouchableOpacity onPress={() => setOpenDrawer(null)} style={styles.confirmRepBtn}>
                      <Text style={styles.confirmRepBtnText}>Confirmar Ajuste</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            </View>
          </View>
        )}

        {/* POP-UP CONFLITO DE RECORRÊNCIA */}
        {modalRepeticaoOpen && (
          <View style={StyleSheet.absoluteFillObject}>
            <View style={styles.alertOverlay}>
              <View style={styles.alertBox}>
                <View style={styles.alertIconCircle}>
                  <ArrowRightLeft size={24} color={currentTheme.primary} />
                </View>
                <Text style={styles.alertTitle}>Atenção!</Text>
                <Text style={styles.alertDescription}>
                  Este lançamento faz parte de uma recorrência. Onde deseja aplicar esta edição?
                </Text>
                
                <View style={{ gap: 8 }}>
                  <TouchableOpacity onPress={() => finalizarSalvar(false)} style={styles.alertSecondaryBtn}>
                    <Text style={styles.alertSecondaryText}>Somente neste</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => finalizarSalvar(true)} style={styles.alertPrimaryBtn}>
                    <Text style={styles.alertPrimaryText}>Neste e nos próximos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setModalRepeticaoOpen(false)} style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: currentTheme.mutedForeground, fontWeight: 'bold', fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* MODAL FORM CATEGORIA INTEGRADO */}
      <FormCategoria open={showFormCat} onClose={() => setShowFormCat(false)} defaultTipo={tipo} onSaved={handleCatSaved} />
    </>
  )
}

const { width } = Dimensions.get('window')

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  saveBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 20,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 4,
    width: '100%',
    maxWidth: 280,
    borderWidth: 1,
    borderColor: theme.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    paddingHorizontal: 40,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '900',
    marginRight: 4,
    marginTop: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 160,
    maxWidth: '80%',
    padding: 0,
  },
  calcToggleBtn: {
    position: 'absolute',
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  descInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderBottomWidth: 2,
    borderColor: theme.border,
    paddingBottom: 6,
  },
  descTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.foreground,
    padding: 0,
  },
  calcWrapper: {
    padding: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  cardFormContainer: {
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  formRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  rowItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowItemLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  statusSubLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  rowItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '50%',
  },
  rowItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.mutedForeground,
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    padding: 0,
    width: 100,
  },
  
  // Drawer / Bottom Sheets Stylings
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    flex: 1,
  },
  drawerContentContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: 500,
  },
  drawerIndicatorRow: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  drawerIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.border,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  drawerCloseIcon: {
    padding: 6,
    backgroundColor: theme.card,
    borderRadius: 20,
  },
  drawerCreateBtn: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  drawerCreateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.mutedForeground,
    marginVertical: 20,
    fontSize: 14,
  },
  drawerItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  drawerItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  drawerSectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: theme.mutedForeground,
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  
  // Repetição Drawer específico
  repTabsBox: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  repTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  repTabBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  freqBubble: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: theme.card,
  },
  freqBubbleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  parcelasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
  },
  parcelaGridItem: {
    width: (width - 64) / 5,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelaGridItemText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  confirmRepBtn: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 30,
  },
  confirmRepBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Alert Modal
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  alertIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.foreground,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    color: theme.mutedForeground,
    lineHeight: 18,
    marginBottom: 20,
  },
  alertPrimaryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  alertPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertSecondaryBtn: {
    backgroundColor: theme.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  alertSecondaryText: {
    color: theme.foreground,
    fontWeight: 'bold',
    fontSize: 14,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.mutedForeground,
  },
  balanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.foreground,
  }
})