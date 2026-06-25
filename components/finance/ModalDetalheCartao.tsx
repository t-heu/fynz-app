import { APP_URL } from "@/constants/vars"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { CATEGORIA_ICONS } from '@/lib/categoria-icons'
import { COLORS } from "@/lib/colors"
import { dtISO, fm, MESES, processarSaldoConta } from '@/lib/finance-utils'
import { AlertCircle, Building2, CheckCircle2, ChevronLeft, ChevronRight, Circle, CreditCard, Star } from 'lucide-react-native'
import React, { useMemo, useState } from 'react'
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

// IMPORTAÇÃO NOVA
import { FormLancamento } from './FormLancamento'

interface Props {
  cartao: any | null
  onClose: () => void
}

export function ModalDetalheCartao({ cartao, onClose }: Props) {
  const { dados, salvar } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const now = new Date()
  const [mes, setMes] = useState(now.getMonth())
  const [ano, setAno] = useState(now.getFullYear())
  
  // Estados do Modal de Pagamento
  const [showPagar, setShowPagar] = useState(false)
  const [itensSelecionados, setItensSelecionados] = useState<number[]>([])
  const [contaOrigem, setContaOrigem] = useState(dados.contas[0]?.id ? String(dados.contas[0].id) : '')

  // Estados do Pop-up de Antecipação
  const [showAntecipacao, setShowAntecipacao] = useState(false)
  const [dataAntecipacao, setDataAntecipacao] = useState(dtISO())

  // ESTADO NOVO: Controle de Edição de Gasto
  const [editandoId, setEditandoId] = useState<number | null>(null)

  // Lógica de Datas
  function navMes(dir: number) {
    let m = mes + dir, a = ano
    if (m < 0) { m = 11; a-- }
    if (m > 11) { m = 0; a++ }
    setMes(m); setAno(a)
  }

  const mesAtualStr = String(mes + 1).padStart(2, '0')
  
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
      const isPagamento = l.tipo === 'PagamentoFatura' 
      const isAntecipado = (l.descricao || '').includes('(Antecipado)')
      
      const dataRef = getMesAno(l.data, Number(cartao.fechamento), isParcelado || isPagamento || isAntecipado)
      
      return dataRef.mes === mes && dataRef.ano === ano
    }).sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [dados.lancamentos, cartao, mes, ano])

  const totalFatura = useMemo(() => 
    gastos.filter((l: any) => l.tipo !== 'PagamentoFatura').reduce((t: number, l: any) => t + l.valor, 0)
  , [gastos])

  const despesasAbertas = useMemo(() => 
    gastos.filter((l: any) => l.tipo !== 'PagamentoFatura' && !l.pago)
  , [gastos])

  const temGastos = useMemo(() => {
    return gastos.filter((l: any) => l.tipo === 'Despesa').length > 0
  }, [gastos])

  const todosPagos = useMemo(() => {
    const despesas = gastos.filter((l: any) => l.tipo === 'Despesa')
    return despesas.length > 0 && despesas.every((l: any) => l.pago === true)
  }, [gastos])

  const totalSelecionado = useMemo(() => 
    despesasAbertas.filter((l: any) => itensSelecionados.includes(l.id)).reduce((acc: number, l: any) => acc + l.valor, 0)
  , [despesasAbertas, itensSelecionados])

  const contaSelecionada = useMemo(() => {
    return dados.contas.find((c: any) => String(c.id) === contaOrigem)
  }, [contaOrigem, dados.contas])

  if (!cartao) return null

  const agrupado: Record<string, typeof gastos> = {}
  gastos.forEach((l: any) => {
    const dt = l.data || dtISO()
    if (!agrupado[dt]) agrupado[dt] = []
    agrupado[dt].push(l)
  })

  function abrirModalPagamento() {
    if (despesasAbertas.length === 0) {
      Alert.alert('Aviso', 'Não há gastos pendentes para quitar neste mês.')
      return
    }
    setItensSelecionados(despesasAbertas.map((d: any) => d.id))
    setShowPagar(true)
  }

  function handleConfirmarClick() {
    if (itensSelecionados.length === 0) return Alert.alert('Aviso', 'Selecione pelo menos um gasto para quitar.')
    if (totalSelecionado <= 0) return Alert.alert('Aviso', 'O valor selecionado é inválido.')
    
    const isFuturo = ano > now.getFullYear() || (ano === now.getFullYear() && mes > now.getMonth())
    
    if (isFuturo) {
      setDataAntecipacao(dtISO()) 
      setShowAntecipacao(true) 
    } else {
      executarPagamento(dtISO(), false) 
    }
  }

  function executarPagamento(dataPagamento: string, isAntecipacao: boolean) {
    if (itensSelecionados.length === 0 || totalSelecionado <= 0) return
    
    const novosDados = { ...dados, lancamentos: [...dados.lancamentos] }
    
    processarSaldoConta(novosDados, contaOrigem, totalSelecionado, 'Despesa')
    
    novosDados.lancamentos.push({
      id: Date.now(), tipo: 'PagamentoFatura', valor: totalSelecionado,
      descricao: `Pagamento da Fatura: ${cartao!.nome}`,
      categoriaId: 'FATURA', fonte: 'C-' + contaOrigem,
      destinoCartao: cartao!.id, data: dataPagamento, pago: true
    })

    novosDados.lancamentos = novosDados.lancamentos.map((lanc: any) => {
        if (itensSelecionados.includes(lanc.id)) {
            if (isAntecipacao) {
               return { 
                 ...lanc, 
                 pago: true, 
                 data: dataPagamento, 
                 descricao: lanc.descricao?.includes('(Antecipado)') 
                    ? lanc.descricao 
                    : `${lanc.descricao || ''} (Antecipado)` 
               }
            }
            return { ...lanc, pago: true }
        }
        return lanc
    })

    salvar(novosDados)
    setShowAntecipacao(false)
    setShowPagar(false)
    setItensSelecionados([])
    onClose()
  }

  function toggleItem(id: number) {
    if (itensSelecionados.includes(id)) {
      setItensSelecionados(prev => prev.filter(i => i !== id))
    } else {
      setItensSelecionados(prev => [...prev, id])
    }
  }

  // Permite ciclar pelas contas disponíveis tocando no nome da conta no Bottom Sheet
  function alternarConta() {
    const idxAtual = dados.contas.findIndex((c: any) => String(c.id) === contaOrigem)
    const proximaConta = dados.contas[(idxAtual + 1) % dados.contas.length]
    if (proximaConta) setContaOrigem(String(proximaConta.id))
  }

  return (
    <>
      <Modal visible={true} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtnRow}>
              <ChevronLeft size={24} color={currentTheme.foreground} />
              <Text style={styles.headerTitle}>Gestão de Cartão</Text>
            </TouchableOpacity>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
            
            <View style={styles.calendarNavContainer}>
              <View style={styles.calendarNavBox}>
                <TouchableOpacity onPress={() => navMes(-1)} style={styles.navArrow}>
                  <ChevronLeft size={22} color={currentTheme.foreground} />
                </TouchableOpacity>
                <Text style={styles.calendarText}>
                  {MESES[mes]} {ano}
                </Text>
                <TouchableOpacity onPress={() => navMes(1)} style={styles.navArrow}>
                  <ChevronRight size={22} color={currentTheme.foreground} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroCenter}>
              <View style={styles.logoCircle}>
                {cartao.icone ? (
                  <Image source={{ uri: cartao.icone.includes('http') ? cartao.icone : APP_URL + cartao.icone }} style={styles.logoImg} resizeMode="contain" />
                ) : (
                  <CreditCard size={40} color={currentTheme.mutedForeground} />
                )}
              </View>
              <Text style={styles.cardName}>{cartao.nome}</Text>
              
              {/* Lógica das 3 Tags Atualizada */}
              {(() => {
                if (!temGastos) {
                  return (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                      <Star size={12} color="#3B82F6" />
                      <Text style={[styles.statusBadgeText, { color: '#3B82F6' }]}>
                        Parabéns, você não possui gastos
                      </Text>
                    </View>
                  )
                }
                if (todosPagos) {
                  return (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                      <CheckCircle2 size={12} color="#22C55E" />
                      <Text style={[styles.statusBadgeText, { color: '#22C55E' }]}>
                        Pago
                      </Text>
                    </View>
                  )
                }
                return (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                    <AlertCircle size={12} color="#F97316" />
                    <Text style={[styles.statusBadgeText, { color: '#F97316' }]}>
                      Fatura em Aberto
                    </Text>
                  </View>
                )
              })()}
            </View>

            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>Fechamento</Text>
                  <Text style={styles.cellValue}>Dia {String(cartao.fechamento).padStart(2, "0")}/{mesAtualStr}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>Vencimento</Text>
                  <Text style={styles.cellValue}>Dia {String(cartao.vencimento).padStart(2, "0")}/{mesAtualStr}</Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={[styles.gridCell, { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.cellLabel, { color: '#EF4444' }]}>Gasto no Mês</Text>
                  <Text numberOfLines={1} style={styles.cellValueHuge}>R$ {fm(totalFatura)}</Text>
                </View>
                
                <TouchableOpacity 
                  onPress={abrirModalPagamento} 
                  disabled={todosPagos}
                  style={[styles.payCell, todosPagos && { opacity: 0.5 }]}
                >
                  <Text style={styles.payCellLabel}>Pagar Fatura</Text>
                  <View style={styles.payCellRow}>
                    <Text style={styles.payCellTitle}>Quitar</Text>
                    <ChevronRight size={16} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Extrato Mensal</Text>
              <Text style={styles.sectionSubtitle}>{gastos.length} lançamentos</Text>
            </View>

            <View style={styles.listContainer}>
              {gastos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: currentTheme.mutedForeground, fontSize: 14, fontWeight: '500' }}>Sem registros neste mês.</Text>
                </View>
              ) : (
                Object.entries(agrupado).map(([dt, items]) => (
                  <View key={dt} style={styles.dateGroup}>
                    <Text style={styles.dateGroupLabel}>{dt.split('-').reverse().join('/')}</Text>
                    {items.map((l: any) => {
                      const isPagamento = l.tipo === 'PagamentoFatura'
                      const cat = (dados.categorias || []).find((x: any) => x.id == l.categoriaId) || { nome: 'Sem categoria', icone: '🏷️', cor: '#888' }
                      const parcela = (l.descricao || '').match(/\((\d+)\/(\d+)\)/)
                      const isRecorrente = (l.descricao || '').includes('recurrence')
                      const isAntecipado = (l.descricao || '').includes('(Antecipado)')
                      const Icone = CATEGORIA_ICONS[cat.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Circle

                      return (
                        <TouchableOpacity 
                          key={l.id} 
                          activeOpacity={isPagamento ? 1 : 0.7}
                          onPress={() => {
                            if (isPagamento) return;
                            setEditandoId(l.id);
                          }}
                          style={styles.transactionCard}
                        >
                          <View style={styles.transactionIconContainer}>
                            <View style={[styles.transactionIcon, { backgroundColor: isPagamento ? 'rgba(34, 197, 94, 0.2)' : cat.cor + '20' }]}>
                              {isPagamento ? <CheckCircle2 size={20} color="#22c55e" /> : <Icone size={20} color={cat.cor || currentTheme.foreground} />}
                            </View>
                          </View>
                          
                          <View style={styles.transactionBody}>
                            {isPagamento && (
                              <Text numberOfLines={1} style={[styles.transactionTitle, isPagamento && { color: '#22c55e' }]}>
                                {isPagamento ? 'Pagamento da Fatura' : (l.descricao || '').replace(/\(\d+\/\d+\)/g, '').replace(/recurrence/g, '').replace(/\(Antecipado\)/g, '').trim()}
                              </Text>
                            )}
                            {!isPagamento && (
                              <Text numberOfLines={1} style={styles.transactionCategory}>{cat.nome}</Text>
                            )}
                            <View style={styles.tagsRow}>
                              {parcela && <Text style={styles.tagText}>Parcela {parcela[1]} de {parcela[2]}</Text>}
                              {isRecorrente && <Text style={styles.tagText}>Recorrente</Text>}
                              {isAntecipado && <Text style={[styles.tagText, { color: '#FB923C', backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>Antecipado</Text>}
                            </View>
                          </View>

                          <View style={styles.transactionTrailing}>
                            <Text style={[styles.transactionValue, isPagamento && { color: '#22c55e' }]}>
                              {isPagamento ? '' : '-'}R$ {fm(l.valor)}
                            </Text>
                            {!isPagamento && (
                              <View style={[styles.statusMiniBadge, { backgroundColor: l.pago ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                <Text style={[styles.statusMiniText, { color: l.pago ? '#22c55e' : '#EF4444' }]}>
                                  {l.pago ? 'PAGO' : 'ABERTO'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* BOTTOM SHEET - PAGAMENTO */}
      <Modal visible={showPagar} animationType="slide" transparent={true}>
        <View style={styles.bottomSheetWrapper}>
          <View style={styles.bottomSheetContent}>
            
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowPagar(false)}>
                <ChevronLeft size={24} color={currentTheme.foreground} />
              </TouchableOpacity>
              <Text style={styles.sheetHeaderTitle}>Resumo da Fatura</Text>
              <TouchableOpacity onPress={handleConfirmarClick}>
                <Text style={styles.sheetConfirmBtn}>Confirmar</Text>
              </TouchableOpacity>
            </View>

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
              <View style={styles.sheetFooterRow}>
                <View>
                  <Text style={styles.sheetFooterLabel}>Sairá de (Toque para trocar):</Text>
                  <TouchableOpacity onPress={alternarConta}>
                    <Text style={styles.sheetFooterAccountName}>{contaSelecionada?.nome || 'Selecione'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.accountIconCircle}>
                  {contaSelecionada?.icone ? (
                    <Image source={{ uri: contaSelecionada.icone }} style={{width: 24, height: 24}} resizeMode="contain" />
                  ) : (
                    <Building2 size={18} color={currentTheme.mutedForeground} />
                  )}
                </View>
              </View>
              
              <View style={styles.sheetTotalRow}>
                <Text style={styles.sheetFooterLabel}>Total a Quitar:</Text>
                <Text style={styles.sheetTotalValue}>R$ {fm(totalSelecionado)}</Text>
              </View>
            </View>

          </View>
        </View>
      </Modal>

      {/* POP-UP DE AVISO DE ANTECIPAÇÃO */}
      <Modal visible={showAntecipacao} transparent={true} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.alertIconCircle}>
              <AlertCircle size={24} color={currentTheme.primary} />
            </View>
            <Text style={styles.alertTitle}>Antecipação de Gastos</Text>
            <Text style={styles.alertDescription}>
              Você selecionou {itensSelecionados.length} gasto(s) de uma fatura futura para quitar. Eles receberão o selo de "Antecipado" e serão movidos para a data abaixo:
            </Text>
            
            <TextInput
               style={styles.alertInput}
               value={dataAntecipacao}
               onChangeText={setDataAntecipacao}
               placeholder="YYYY-MM-DD"
               placeholderTextColor={currentTheme.mutedForeground}
            />

            <TouchableOpacity style={styles.alertPrimaryBtn} onPress={() => executarPagamento(dataAntecipacao, true)}>
              <Text style={styles.alertPrimaryText}>Sim, confirmar antecipação</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertSecondaryBtn} onPress={() => setShowAntecipacao(false)}>
              <Text style={styles.alertSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FORMULÁRIO DE EDIÇÃO RENDERIZADO NO FINAL */}
      <FormLancamento
        open={editandoId !== null}
        onClose={() => setEditandoId(null)}
        editandoId={editandoId}
      />
    </>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  calendarNavContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  calendarNavBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 6,
  },
  navArrow: {
    padding: 8,
    borderRadius: 12,
  },
  calendarText: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.foreground,
  },
  heroCenter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: theme.border,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.foreground,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gridContainer: {
    gap: 16,
    marginBottom: 32,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridCell: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.mutedForeground,
    marginBottom: 4,
  },
  cellValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  cellValueHuge: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.foreground,
  },
  payCell: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    backgroundColor: theme.primary,
    justifyContent: 'center',
  },
  payCellLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  payCellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payCellTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.mutedForeground,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.mutedForeground,
  },
  listContainer: {
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  dateGroup: {
    marginBottom: 16,
    gap: 8,
  },
  dateGroupLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.mutedForeground,
    marginLeft: 8,
    marginBottom: 4,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.card,
    gap: 12,
  },
  transactionIconContainer: {
    justifyContent: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionBody: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.foreground,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.mutedForeground,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#c084fc',
    textTransform: 'uppercase',
  },
  transactionTrailing: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.foreground,
    marginBottom: 4,
  },
  statusMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusMiniText: {
    fontSize: 9,
    fontWeight: '900',
  },
  
  // Bottom Sheet (Pagamento)
  bottomSheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheetContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sheetHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  sheetConfirmBtn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.primary,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: theme.mutedForeground,
  },
  sheetToggleAllBtn: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: theme.primary,
  },
  sheetList: {
    paddingHorizontal: 16,
  },
  sheetItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  sheetItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkboxIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.mutedForeground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.foreground,
    flex: 1,
  },
  sheetItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  sheetFooter: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 24,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sheetFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 16,
    marginBottom: 16,
  },
  sheetFooterLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: theme.mutedForeground,
    marginBottom: 4,
  },
  sheetFooterAccountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  accountIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTotalRow: {
    alignItems: 'flex-start',
  },
  sheetTotalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.primary,
  },

  // Modal Antecipação
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  alertIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(var(--primary-rgb), 0.1)', // Ajuste se não usar rgba
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.foreground,
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: theme.mutedForeground,
    marginBottom: 20,
    lineHeight: 20,
  },
  alertInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: theme.foreground,
    marginBottom: 24,
    backgroundColor: theme.background,
  },
  alertPrimaryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  alertPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertSecondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertSecondaryText: {
    color: theme.mutedForeground,
    fontWeight: 'bold',
    fontSize: 12,
  },
})
