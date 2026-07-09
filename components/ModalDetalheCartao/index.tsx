import { APP_URL } from "@/constants/vars"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { CATEGORIA_ICONS } from '@/lib/categoria-icons'
import { COLORS } from "@/lib/colors"
import { fm, MESES } from '@/lib/finance-utils'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Circle, CreditCard, Star } from 'lucide-react-native'
import React, { useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { ModalFullscreen } from '../ui/ModalFullscreen'

// Modais e Hooks Externos
import { useCartaoFatura } from '../../hooks/use-cartao-fatura'
import { FormLancamento } from '../FormLancamento'
import { SheetConfirmacaoData } from './SheetConfirmacaoData'
import { SheetPagamentoFatura } from './SheetPagamentoFatura'

interface Props {
  cartao: any | null
  onClose: () => void
}

export function ModalDetalheCartao({ cartao, onClose }: Props) {
  const { dados } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  // 1. Hook de Regras de Negócio (Toda a lógica veio para cá)
  const { 
    mes, ano, navMes, now,
    gastos, despesasAbertas, totalFatura, temGastos, todosPagos, agrupado,
    executarPagamento
  } = useCartaoFatura(cartao)

  // 2. Estados de Navegação e UI
  const mesAtualStr = String(mes + 1).padStart(2, '0')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  
  // Controle de Pagamento
  const [showPagar, setShowPagar] = useState(false)
  const [showConfirmacaoDate, setShowConfirmacaoDate] = useState(false)
  const [dadosPrePagamento, setDadosPrePagamento] = useState<any>(null)
  const [isAntecipacaoMode, setIsAntecipacaoMode] = useState(false)

  if (!cartao) return null

  function iniciarPagamento() {
    if (despesasAbertas.length === 0) {
      Alert.alert('Aviso', 'Não há gastos pendentes para quitar neste mês.')
      return
    }
    setShowPagar(true)
  }

  function abrirConfirmacao(dadosPagamento: any) {
    const isFuturo = ano > now.getFullYear() || (ano === now.getFullYear() && mes > now.getMonth())
    setIsAntecipacaoMode(isFuturo)
    setDadosPrePagamento(dadosPagamento)
    setShowConfirmacaoDate(true)
  }

  function confirmarPagamentoFinal(dataConfirmada: string) {
    // 1. Trava de segurança: Se os dados forem nulos, cancela a execução para evitar o erro.
    if (!dadosPrePagamento) {
      console.warn("Os dados de pagamento ainda não foram carregados no estado.")
      return
    }

    const sucesso = executarPagamento(
      dadosPrePagamento.itensSelecionados,
      dadosPrePagamento.valorPersonalizado,
      dadosPrePagamento.origemPagamento,
      dataConfirmada,
      isAntecipacaoMode
    )
    
    if (sucesso) {
      setShowConfirmacaoDate(false)
      setShowPagar(false)
      setDadosPrePagamento(null) // 2. Limpa os dados da memória após o sucesso
      onClose()
    }
  }

  return (
    <>
      <ModalFullscreen
        open={true}
        onClose={onClose}
        title={"Gestão de Cartão"}
        backIcon
      >
        <View style={styles.container}>
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
              
              {(() => {
                if (!temGastos) return (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Star size={12} color="#3B82F6" />
                    <Text style={[styles.statusBadgeText, { color: '#3B82F6' }]}>Parabéns, você não possui gastos</Text>
                  </View>
                )
                if (todosPagos) return (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <CheckCircle2 size={12} color="#22C55E" />
                    <Text style={[styles.statusBadgeText, { color: '#22C55E' }]}>Pago</Text>
                  </View>
                )
                return (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                    <AlertCircle size={12} color="#F97316" />
                    <Text style={[styles.statusBadgeText, { color: '#F97316' }]}>Fatura em Aberto</Text>
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
                  onPress={iniciarPagamento} 
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
                      const isPagamentoDestaFatura = l.tipo === 'PagamentoFatura' && l.destinoCartao === cartao.id
                      
                      if (isPagamentoDestaFatura) {
                        let fonteText = 'Origem desconhecida';
                        if (l.fonte?.startsWith('C-')) {
                          const nome = dados.contas.find((c: any) => String(c.id) === l.fonte?.replace('C-', ''))?.nome;
                          if (nome) fonteText = `Conta: ${nome}`;
                        } else if (l.fonte?.startsWith('T-')) {
                          const nome = dados.cartoes.find((c: any) => String(c.id) === l.fonte?.replace('T-', ''))?.nome;
                          if (nome) fonteText = `Cartão de Crédito: ${nome}`;
                        }
                        
                        return (
                          <TouchableOpacity 
                            key={l.id} activeOpacity={1} onPress={() => setEditandoId(l.id)}
                            style={[styles.transactionCard, { borderColor: 'rgba(34, 197, 94, 0.3)', borderWidth: 1, paddingLeft: 0, overflow: 'hidden' }]}
                          >
                            <View style={{ width: 4, height: '100%', backgroundColor: '#22c55e' }} />
                            <View style={{ flex: 1, paddingVertical: 12, paddingRight: 16, paddingLeft: 12 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <CheckCircle2 size={18} color="#22c55e" />
                                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#22c55e' }}>Fatura Paga</Text>
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: '900', color: '#22c55e' }}>
                                  R$ {fm(l.valor)}
                                </Text>
                              </View>
                              <Text style={{ fontSize: 12, fontWeight: '500', color: currentTheme.mutedForeground, lineHeight: 18 }}>
                                Pagamento registrado utilizando o saldo de: <Text style={{ color: currentTheme.foreground, fontWeight: 'bold' }}>{fonteText}</Text>.
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )
                      }

                      const isPagamentoOutraFatura = l.tipo === 'PagamentoFatura' && l.fonte === `T-${cartao.id}`
                      const cat = (dados.categorias || []).find((x: any) => x.id == l.categoriaId) || { nome: 'Sem categoria', icone: '🏷️', cor: '#888' }
                      const parcela = (l.descricao || '').match(/\((\d+)\/(\d+)\)/)
                      const isRecorrente = (l.descricao || '').includes('recurrence')
                      const isAntecipado = (l.descricao || '').includes('(Antecipado)')
                      const Icone = CATEGORIA_ICONS[cat.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Circle

                      return (
                        <TouchableOpacity key={l.id} activeOpacity={0.7} onPress={() => setEditandoId(l.id)} style={styles.transactionCard}>
                          <View style={styles.transactionIconContainer}>
                            <View style={[styles.transactionIcon, { backgroundColor: cat.cor + '20' }]}>
                              <Icone size={20} color={cat.cor || currentTheme.foreground} />
                            </View>
                          </View>
                          
                          <View style={styles.transactionBody}>
                            <Text numberOfLines={1} style={styles.transactionTitle}>
                               {isPagamentoOutraFatura 
                                    ? 'Pagou fatura de outro cartão' 
                                    : (l.descricao || '').replace(/\(\d+\/\d+\)/g, '').replace(/recurrence/g, '').replace(/\(Antecipado\)/g, '').trim()}
                            </Text>
                            <Text numberOfLines={1} style={styles.transactionCategory}>
                               {isPagamentoOutraFatura ? 'Fatura' : cat.nome}
                            </Text>
                            <View style={styles.tagsRow}>
                              {parcela && <Text style={styles.tagText}>Parcela {parcela[1]} de {parcela[2]}</Text>}
                              {isRecorrente && <Text style={styles.tagText}>Recorrente</Text>}
                              {isAntecipado && <Text style={[styles.tagText, { color: '#FB923C', backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>Antecipado</Text>}
                            </View>
                          </View>

                          <View style={styles.transactionTrailing}>
                            <Text style={styles.transactionValue}>-R$ {fm(l.valor)}</Text>
                            <View style={[styles.statusMiniBadge, { backgroundColor: l.pago ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                              <Text style={[styles.statusMiniText, { color: l.pago ? '#22c55e' : '#EF4444' }]}>
                                {l.pago ? 'PAGO' : 'ABERTO'}
                              </Text>
                            </View>
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

        {/* COMPONENTES FILHOS (Modais isolados!) */}
        <SheetPagamentoFatura 
          open={showPagar}
          onClose={() => setShowPagar(false)}
          despesasAbertas={despesasAbertas}
          cartao={cartao}
          onConfirmClick={abrirConfirmacao}
        />

        <SheetConfirmacaoData 
          open={showConfirmacaoDate}
          onClose={() => setShowConfirmacaoDate(false)}
          isAntecipacaoMode={isAntecipacaoMode}
          itensCount={dadosPrePagamento?.itensSelecionados?.length || 0}
          valorPersonalizado={dadosPrePagamento?.valorPersonalizado || '0,00'}
          onConfirmar={confirmarPagamentoFinal}
        />
      </ModalFullscreen>

      <FormLancamento
        open={editandoId !== null}
        onClose={() => setEditandoId(null)}
        editandoId={editandoId}
      />
    </>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  calendarNavContainer: { paddingTop: 10, paddingBottom: 20 },
  calendarNavBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderRadius: 16, padding: 6 },
  navArrow: { padding: 8, borderRadius: 12 },
  calendarText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: theme.foreground },
  heroCenter: { alignItems: 'center', paddingVertical: 20 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: theme.border, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%' },
  cardName: { fontSize: 24, fontWeight: 'bold', color: theme.foreground, marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  gridContainer: { gap: 16, marginBottom: 32 },
  gridRow: { flexDirection: 'row', gap: 16 },
  gridCell: { flex: 1, padding: 16, borderRadius: 24, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  cellLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: theme.mutedForeground, marginBottom: 4 },
  cellValue: { fontSize: 16, fontWeight: 'bold', color: theme.foreground },
  cellValueHuge: { fontSize: 20, fontWeight: '900', color: theme.foreground },
  payCell: { flex: 1, padding: 16, borderRadius: 24, backgroundColor: theme.primary, justifyContent: 'center' },
  payCellLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  payCellRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  payCellTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: theme.mutedForeground },
  sectionSubtitle: { fontSize: 10, fontWeight: '500', color: theme.mutedForeground },
  listContainer: { gap: 12 },
  emptyContainer: { paddingVertical: 48, alignItems: 'center', borderRadius: 24, borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed' },
  dateGroup: { marginBottom: 16, gap: 8 },
  dateGroupLabel: { fontSize: 10, fontWeight: 'bold', color: theme.mutedForeground, marginLeft: 8, marginBottom: 4 },
  transactionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 20, backgroundColor: theme.card, gap: 12 },
  transactionIconContainer: { justifyContent: 'center' },
  transactionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  transactionBody: { flex: 1, justifyContent: 'center' },
  transactionTitle: { fontSize: 14, fontWeight: 'bold', color: theme.foreground, marginBottom: 2 },
  transactionCategory: { fontSize: 12, fontWeight: '600', color: theme.mutedForeground },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#c084fc', textTransform: 'uppercase' },
  transactionTrailing: { alignItems: 'flex-end', justifyContent: 'center' },
  transactionValue: { fontSize: 14, fontWeight: '900', color: theme.foreground, marginBottom: 4 },
  statusMiniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusMiniText: { fontSize: 9, fontWeight: '900' },
})