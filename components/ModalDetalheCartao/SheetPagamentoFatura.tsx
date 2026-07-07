import { ModalManual } from '@/components/ui/ModalManual'
import { APP_URL } from "@/constants/vars"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from "@/lib/colors"
import { aplicarMascaraMoeda, fm, lerValorMoeda } from '@/lib/finance-utils'
import { Building2, CheckCircle2, ChevronLeft, Eye, EyeOff } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

interface Props {
  open: boolean
  onClose: () => void
  despesasAbertas: any[]
  cartao: any
  onConfirmClick: (dadosPagamento: {
    itensSelecionados: number[],
    valorPersonalizado: string,
    origemPagamento: string
  }) => void
}

export function SheetPagamentoFatura({ open, onClose, despesasAbertas, cartao, onConfirmClick }: Props) {
  const { dados } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const [itensSelecionados, setItensSelecionados] = useState<number[]>([])
  const [valorPersonalizado, setValorPersonalizado] = useState('')
  const [showSaldo, setShowSaldo] = useState(false)
  
  const defaultOrigem = dados.contas[0]?.id ? `C-${dados.contas[0].id}` : ''
  const [origemPagamento, setOrigemPagamento] = useState(defaultOrigem)

  // Atualiza seleção ao abrir
  useEffect(() => {
    if (open) {
      setItensSelecionados(despesasAbertas.map((d: any) => d.id))
    }
  }, [open, despesasAbertas])

  const totalSelecionado = useMemo(() => 
    despesasAbertas.filter((l: any) => itensSelecionados.includes(l.id)).reduce((acc: number, l: any) => acc + l.valor, 0)
  , [despesasAbertas, itensSelecionados])

  useEffect(() => {
    setValorPersonalizado(fm(totalSelecionado))
  }, [totalSelecionado])

  const fonteSelecionada = useMemo(() => {
    if (origemPagamento.startsWith('C-')) {
      return dados.contas.find((c: any) => String(c.id) === origemPagamento.replace('C-', ''))
    } else if (origemPagamento.startsWith('T-')) {
      return dados.cartoes.find((c: any) => String(c.id) === origemPagamento.replace('T-', ''))
    }
    return null
  }, [origemPagamento, dados.contas, dados.cartoes])

  let saldoVisivel = 0
  let labelSaldo = 'Saldo disponível'
  if (origemPagamento.startsWith('C-') && fonteSelecionada) {
    saldoVisivel = (fonteSelecionada as any).saldo || 0
  } else if (origemPagamento.startsWith('T-') && fonteSelecionada) {
    const limiteBase = (fonteSelecionada as any).limite || 0
    const faturasPendentes = dados.lancamentos
      .filter((l: any) => (l.fonte === `T-${fonteSelecionada.id}` || l.destinoCartao === fonteSelecionada.id) && !l.pago && !(l.tipo === 'PagamentoFatura' && l.destinoCartao === fonteSelecionada.id))
      .reduce((acc: number, l: any) => acc + l.valor, 0)
    saldoVisivel = limiteBase - faturasPendentes
    labelSaldo = 'Limite disponível'
  }

  function alternarConta() {
    const fontesValidas: string[] = [
      ...dados.contas.map((c: any) => `C-${c.id}`),
      ...dados.cartoes.filter((c: any) => c.id !== cartao?.id).map((c: any) => `T-${c.id}`)
    ]
    const idxAtual = fontesValidas.indexOf(origemPagamento)
    const proximaFonte = fontesValidas[(idxAtual + 1) % fontesValidas.length]
    if (proximaFonte) setOrigemPagamento(proximaFonte)
  }

  function handleConfirmar() {
    if (itensSelecionados.length === 0) return Alert.alert('Aviso', 'Selecione pelo menos um gasto para quitar.')
    const vFinal = lerValorMoeda(valorPersonalizado)
    if (vFinal <= 0) return Alert.alert('Aviso', 'O valor a quitar é inválido.')
    if (!origemPagamento) return Alert.alert('Aviso', 'Selecione uma origem de pagamento.')
    
    onConfirmClick({ itensSelecionados, valorPersonalizado, origemPagamento })
  }

  function toggleItem(id: number) {
    if (itensSelecionados.includes(id)) {
      setItensSelecionados(prev => prev.filter(i => i !== id))
    } else {
      setItensSelecionados(prev => [...prev, id])
    }
  }

  return (
    <ModalManual
      open={open}
      onClose={onClose}
      title={'Resumo da Fatura'}
      headerLeft={
        <TouchableOpacity onPress={onClose}>
          <ChevronLeft size={24} color={currentTheme.foreground} />
        </TouchableOpacity>
      }
      headerRight={
        <TouchableOpacity onPress={handleConfirmar}>
          <Text style={styles.sheetConfirmBtn}>Confirmar</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.bottomSheetWrapper}>
        <View style={styles.bottomSheetContent}>
          <View style={styles.sheetActionsRow}>
            <Text style={styles.sheetSubtitle}>Gastos pendentes ({despesasAbertas.length})</Text>
            <TouchableOpacity onPress={() => setItensSelecionados(itensSelecionados.length === despesasAbertas.length ? [] : despesasAbertas.map((d: any)=>d.id))}>
              <Text style={styles.sheetToggleAllBtn}>
                {itensSelecionados.length === despesasAbertas.length ? 'Desmarcar Tudo' : 'Quitar Tudo'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetList} contentContainerStyle={{ paddingBottom: 20 }}>
            {despesasAbertas.map((l: any) => {
              const isSelected = itensSelecionados.includes(l.id)
              return (
                <TouchableOpacity 
                  key={l.id} 
                  onPress={() => toggleItem(l.id)}
                  activeOpacity={0.7}
                  style={[styles.sheetItemCard, isSelected && { borderColor: currentTheme.primary, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }]}
                >
                  <View style={styles.sheetItemRow}>
                    <View style={[styles.checkboxIcon, isSelected && { borderColor: currentTheme.primary, backgroundColor: currentTheme.primary }]}>
                      {isSelected && <CheckCircle2 size={12} color="#fff" strokeWidth={3} />}
                    </View>
                    <Text numberOfLines={1} style={styles.sheetItemTitle}>
                      {(l.descricao || '').replace(/\(\d+\/\d+\)/g, '').replace(/recurrence/g, '').replace(/\(Antecipado\)/g, '').trim()}
                    </Text>
                  </View>
                  <Text style={styles.sheetItemValue}>R$ {fm(l.valor)}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <View style={styles.sheetFooter}>
            <View style={[styles.sheetFooterRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetFooterLabel}>Sairá de (Toque para trocar):</Text>
                
                <TouchableOpacity onPress={alternarConta} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={styles.sheetFooterAccountName}>{fonteSelecionada?.nome || 'Selecione'}</Text>
                  <View style={styles.accountIconCircle}>
                    {fonteSelecionada?.icone ? (
                      <Image source={{ uri: fonteSelecionada.icone.includes('http') ? fonteSelecionada.icone : APP_URL + fonteSelecionada.icone }} style={{width: 24, height: 24}} resizeMode="contain" />
                    ) : (
                      <Building2 size={18} color={currentTheme.mutedForeground} />
                    )}
                  </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: currentTheme.border, marginBottom: 16 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: currentTheme.mutedForeground }}>{labelSaldo}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: currentTheme.foreground }}>
                      {showSaldo ? `R$ ${fm(saldoVisivel)}` : 'R$ •••••'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowSaldo(!showSaldo)}>
                      {showSaldo ? <EyeOff size={16} color={currentTheme.mutedForeground} /> : <Eye size={16} color={currentTheme.mutedForeground} />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={{ alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: currentTheme.border, paddingTop: 16 }}>
              <Text style={styles.sheetFooterLabel}>Total a Quitar (Editável):</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sheetTotalValue}>R$</Text>
                <TextInput
                  style={[styles.sheetTotalValue, { padding: 0, margin: 0, height: 'auto', minWidth: 100 }]}
                  value={valorPersonalizado}
                  onChangeText={(t) => setValorPersonalizado(aplicarMascaraMoeda(t))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </ModalManual>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  bottomSheetWrapper: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheetContent: { backgroundColor: theme.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20 },
  sheetConfirmBtn: { fontSize: 14, fontWeight: 'bold', color: theme.primary },
  sheetActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  sheetSubtitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: theme.mutedForeground },
  sheetToggleAllBtn: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: theme.primary },
  sheetList: { paddingHorizontal: 16 },
  sheetItemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, backgroundColor: theme.card, borderWidth: 2, borderColor: 'transparent', marginBottom: 8 },
  sheetItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkboxIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.mutedForeground, alignItems: 'center', justifyContent: 'center' },
  sheetItemTitle: { fontSize: 14, fontWeight: 'bold', color: theme.foreground, flex: 1 },
  sheetItemValue: { fontSize: 14, fontWeight: 'bold', color: theme.foreground },
  sheetFooter: { marginHorizontal: 16, marginBottom: 32, padding: 20, borderRadius: 24, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  sheetFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 16, marginBottom: 16 },
  sheetFooterLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: theme.mutedForeground, marginBottom: 4 },
  sheetFooterAccountName: { fontSize: 16, fontWeight: 'bold', color: theme.foreground },
  accountIconCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  sheetTotalValue: { fontSize: 24, fontWeight: '900', color: theme.primary },
})