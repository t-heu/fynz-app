import { FormLancamento } from '@/components/finance/FormLancamento'
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { CATEGORIA_ICONS } from '@/lib/categoria-icons'
import { COLORS } from '@/lib/colors'
import { dtISO, fm, formatMesAno, processarSaldoConta } from '@/lib/finance-utils'
import type { Lancamento } from '@/lib/types'
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, Circle, CircleDollarSign, Lock, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react-native'
import React, { useState } from 'react'
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

interface Props {
  abrirLancamento?: number | null
  onAbrirLancamentoClear?: () => void
}

export default function TabLancamentos({ abrirLancamento, onAbrirLancamentoClear }: Props) {
  const { dados, salvar, dataAtualView, mudarMes } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [filtroPago, setFiltroPago] = useState<'todos' | 'pagos' | 'pendentes'>('todos')
  
  const [antecipacao, setAntecipacao] = useState<{ id: number; dataPagamento: string } | null>(null)
  const [modalExclusao, setModalExclusao] = useState<{ id: number; grupoId?: number } | null>(null)
  
  // NOVO: Estado para o modal de bloqueio
  const [alertaBloqueio, setAlertaBloqueio] = useState(false)
  
  const hoje = dtISO()
  const mF = dataAtualView.getMonth()
  const aF = dataAtualView.getFullYear()

  const isPago = (v: any) => v === true || v === 1 || v === 'true'

  // NOVO: Lógica de fechamento portada do Next.js
  const getMesAnoReferencia = (l: Lancamento) => {
    if (!l.data) return { mes: -1, ano: -1 }
    let [anoStr, mesStr, diaStr] = l.data.split('-').map(Number)
    let mesCalculado = mesStr - 1
    let anoCalculado = anoStr

    const cartaoId = l.destinoCartao || (l.fonte?.startsWith('T-') ? parseInt(l.fonte.substring(2)) : null)

    if (cartaoId && l.tipo !== 'PagamentoFatura') {
      const cartao = (dados.cartoes || []).find((c: any) => String(c.id) === String(cartaoId))
      if (cartao) {
        const isParcelado = /\(\d+\/\d+\)/.test(l.descricao || '')
        const isAntecipado = (l.descricao || '').includes('(Antecipado)')
        
        if (!isParcelado && !isAntecipado && diaStr >= Number(cartao.fechamento)) {
          mesCalculado += 1
          if (mesCalculado > 11) {
            mesCalculado = 0
            anoCalculado += 1
          }
        }
      }
    }
    return { mes: mesCalculado, ano: anoCalculado }
  }

  // NOVO: Separação entre lançamentos do mês e pendências atrasadas
  const lancMes = (dados.lancamentos || []).filter((l: Lancamento) => {
    if (l.silencioso) return false
    const ref = getMesAnoReferencia(l)
    return ref.mes === mF && ref.ano === aF
  })

  const atrasados = (dados.lancamentos || []).filter((l: Lancamento) => {
    if (l.silencioso || l.pago) return false
    const ref = getMesAnoReferencia(l)
    return ref.ano < aF || (ref.ano === aF && ref.mes < mF)
  })

  // Juntamos tudo para renderização
  const lancamentosView = [...lancMes, ...atrasados]

  let entradas = 0, saidas = 0
  lancamentosView.forEach((l: Lancamento) => {
    if (l.tipo === 'Receita') entradas += l.valor
    else if (l.tipo === 'Despesa' || l.tipo === 'PagamentoFatura') saidas += l.valor
  })
  const saldo = entradas - saidas

  const agrupado: Record<string, Lancamento[]> = {}
  lancamentosView
    .sort((a: Lancamento, b: Lancamento) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .forEach((l: Lancamento) => {
      const dt = l.data || hoje
      if (!agrupado[dt]) agrupado[dt] = []
      agrupado[dt].push(l)
    })

  function alternarStatus(id: number) {
    const novosDados = { ...dados, lancamentos: [...dados.lancamentos] }
    const l = novosDados.lancamentos.find((x: any) => x.id === id)!
    const dataLanc = new Date((l.data || hoje) + 'T12:00:00')
    const dataHoje = new Date(hoje + 'T12:00:00')
    const isMesFuturo =
      dataLanc.getFullYear() > dataHoje.getFullYear() ||
      (dataLanc.getFullYear() === dataHoje.getFullYear() && dataLanc.getMonth() > dataHoje.getMonth())

    if (!l.pago && isMesFuturo) {
      setAntecipacao({ id, dataPagamento: hoje })
      return
    }

    l.pago = !l.pago

    let contaId = l.fonte?.startsWith('C-') ? parseInt(l.fonte.substring(2)) : null

    if (!contaId && (l.destinoCartao || l.fonte?.startsWith('T-'))) {
      const cartaoId = l.destinoCartao || parseInt(l.fonte?.substring(2) || '0')
      const cartao = (novosDados.cartoes || []).find((c: any) => String(c.id) === String(cartaoId))
      
      if (cartao) {
        contaId = cartao.contaPagamento || novosDados.contas?.[0]?.id
      }
    }

    if (contaId) {
      if (l.pago) processarSaldoConta(novosDados, contaId, l.valor, l.tipo, false)
      else processarSaldoConta(novosDados, contaId, l.valor, l.tipo, true)
    }

    salvar(novosDados)
  }

  function confirmarAntecipacao() {
    if (!antecipacao) return

    const novosDados = { ...dados, lancamentos: [...dados.lancamentos] }
    const l = novosDados.lancamentos.find((x: any) => x.id === antecipacao.id)!
    l.data = antecipacao.dataPagamento
    l.pago = true

    if (!l.descricao?.includes('(Antecipado)')) {
      l.descricao = `${l.descricao || ''} (Antecipado)`.trim()
    }

    let contaId = l.fonte?.startsWith('C-') ? parseInt(l.fonte.substring(2)) : null
    if (!contaId && (l.destinoCartao || l.fonte?.startsWith('T-'))) {
      const cartaoId = l.destinoCartao || parseInt(l.fonte?.substring(2) || '0')
      const cartao = (novosDados.cartoes || []).find((c: any) => String(c.id) === String(cartaoId))
      if (cartao) contaId = cartao.contaPagamento || novosDados.contas?.[0]?.id
    }

    if (contaId) {
      processarSaldoConta(novosDados, contaId, l.valor, l.tipo, false)
    }

    salvar(novosDados)
    setAntecipacao(null)
  }

  function solicitarExclusao(id: number) {
    const l = dados.lancamentos.find((x: any) => x.id === id)
    if (!l) return
    setModalExclusao({ id: l.id, grupoId: l.grupoId })
  }

  function executarExclusao(excluirProximos: boolean) {
    if (!modalExclusao) return

    const novosDados = { ...dados, lancamentos: [...dados.lancamentos] }
    const l = novosDados.lancamentos.find((x: any) => x.id === modalExclusao.id)!

    const getContaId = (lanc: any) => {
      if (lanc.fonte?.startsWith('C-')) return parseInt(lanc.fonte.substring(2))
      if (lanc.destinoCartao || lanc.fonte?.startsWith('T-')) {
        const cartaoId = lanc.destinoCartao || parseInt(lanc.fonte?.substring(2) || '0')
        const cartao = (novosDados.cartoes || []).find((c: any) => String(c.id) === String(cartaoId))
        return cartao?.contaPagamento || novosDados.contas?.[0]?.id
      }
      return null
    }

    if (excluirProximos && l.grupoId) {
      const paraRemover = novosDados.lancamentos.filter((x: any) => x.grupoId === l.grupoId && new Date(x.data) >= new Date(l.data))
      paraRemover.forEach((r: any) => {
        const cId = getContaId(r)
        if (r.pago && cId) processarSaldoConta(novosDados, cId, r.valor, r.tipo, true)
      })
      novosDados.lancamentos = novosDados.lancamentos.filter((x: any) => !paraRemover.includes(x))
    } else {
      if (l.metaId && l.categoriaId === 'META') {
        const meta = novosDados.metas.find((m: any) => m.id === l.metaId)
        if (meta) {
          if (l.movimentoMeta === 'Guardar') meta.depositado -= l.valor
          if (l.movimentoMeta === 'Resgatar') meta.depositado += l.valor
          if (meta.depositado < 0) meta.depositado = 0
        }
      }
      
      const cId = getContaId(l)
      if (l.pago && cId) processarSaldoConta(novosDados, cId, l.valor, l.tipo, true)
      
      novosDados.lancamentos = novosDados.lancamentos.filter((x: any) => x.id !== modalExclusao.id)
    }
    
    salvar(novosDados)
    setModalExclusao(null)
  }

  function abrirEditar(id: number) {
    setEditandoId(id)
    setFormOpen(true)
  }

  const contasMap = Object.fromEntries(
    (dados.contas || []).map((conta: any) => [conta.id, conta])
  )

  const agrupadoFiltrado = Object.entries(agrupado).reduce((acc, [dt, items]) => {
    const filtrados = items.filter((l: any) => {
      if (filtroPago === 'todos') return true
      const isDespesa = l.tipo === 'Despesa'
      if (!isDespesa) return false
      if (filtroPago === 'pagos') return isPago(l.pago)
      if (filtroPago === 'pendentes') return !isPago(l.pago)
      return true
    })

    if (filtrados.length) acc[dt] = filtrados
    return acc
  }, {} as Record<string, any[]>)

  return (
    <View style={styles.container}>
      <View style={styles.monthPickerRow}>
        <TouchableOpacity onPress={() => mudarMes(-1)} style={styles.arrowContainer}>
          <ChevronLeft size={24} color={currentTheme.foreground} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{formatMesAno(dataAtualView)}</Text>
        <TouchableOpacity onPress={() => mudarMes(1)} style={styles.arrowContainer}>
          <ChevronRight size={24} color={currentTheme.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Entradas</Text>
            <Text style={[styles.summaryValue, { color: '#22C55E' }]}>R$ {fm(entradas)}</Text>
          </View>
          <View style={[styles.summaryCol, styles.summaryMiddleBorder]}>
            <Text style={styles.summaryLabel}>Saídas</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>R$ {fm(saidas)}</Text>
            {/* NOVO: Aviso de pendências */}
            {atrasados.length > 0 && (
              <Text style={styles.pendingAlertText}>Inclui pendências</Text>
            )}
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Saldo previsto</Text>
            <Text style={[styles.summaryValue, { color: saldo >= 0 ? '#22C55E' : '#EF4444' }]}>
              R$ {fm(saldo)}
            </Text>
          </View>
        </View>

        <View style={styles.filterPillsRow}>
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'pagos', label: 'Pagos' },
            { key: 'pendentes', label: 'Pendentes' },
          ].map((f) => {
            const active = filtroPago === f.key
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFiltroPago(f.key as any)}
                style={[styles.filterPill, active ? { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary } : { backgroundColor: currentTheme.card }]}
              >
                <Text style={[styles.filterPillText, active ? { color: '#fff' } : { color: currentTheme.foreground }]}>
                   {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {Object.keys(agrupadoFiltrado).length === 0 ? (
          <Text style={styles.emptyText}>Sem lançamentos neste mês.</Text>
        ) : (
          Object.entries(agrupadoFiltrado).map(([dt, items]) => (
            <View key={dt} style={styles.dateGroupContainer}>
              <Text style={styles.dateGroupHeader}>
                {dt === hoje ? 'Hoje' : dt.split('-').reverse().join('/')}
              </Text>
              
              {items.map((l: any) => {
                const cat = (dados.categorias || []).find((x: any) => x.id == l.categoriaId) || {
                  icone: '🏷️',
                  nome: 'Sem categoria',
                  tipo: 'Despesa',
                  cor: '#888',
                }
                const isReceita = l.tipo === 'Receita'
                const sinal = isReceita ? '+' : '-'
                const corValor = isReceita ? '#22C55E' : '#EF4444'
                const destacado = dt === hoje && !l.pago

                const parcela = (l.descricao || '').match(/\((\d+)\/(\d+)\)/)
                const isRecorrente = (l.descricao || '').includes('recurrence')
                const isAntecipado = (l.descricao || '').includes('(Antecipado)')
                
                // NOVO: Verificação de atraso para a tag
                const ref = getMesAnoReferencia(l)
                const isAtrasado = !l.pago && (ref.ano < aF || (ref.ano === aF && ref.mes < mF))

                const Icone = CATEGORIA_ICONS[cat.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Circle
                const idCat = l.categoriaId
                const descName = l.isCartao
                  ? `Cartão: ${l.isCartao.nome}`
                  : `Conta: ${l.tipo === 'PagamentoFatura' ? 'Pagamento de fatura' : contasMap[Number(l.fonte?.replace('C-', ''))]?.nome || cat.tipo}`

                return (
                  <View
                    key={l.id}
                    style={[
                      styles.itemRow,
                      destacado && {
                        borderColor: currentTheme.primary,
                        backgroundColor: 'rgba(var(--primary-rgb), 0.08)', // Adapte caso var() não funcione no RN (ex: use cores literais com opacidade)
                        borderRadius: 12,
                        marginHorizontal: 8,
                        marginVertical: 4,
                        borderWidth: 1
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (l.tipo === 'PagamentoFatura') return;
                        // NOVO: Validação de bloqueio da meta
                        if (l.metaId || l.categoriaId === 'META') {
                          setAlertaBloqueio(true);
                          return;
                        }
                        abrirEditar(l.id);
                      }}
                      style={styles.itemClickableArea}
                    >
                      <View style={[styles.iconBox, { backgroundColor: idCat === 0 ? '#33333320' : `${cat.cor}20` }]}>
                        {idCat === 0 ? (
                          <CircleDollarSign size={20} color="#22C55E" />
                        ) : (
                          <Icone size={20} color={cat.cor} />
                        )}
                      </View>
                      
                      <View style={styles.metaTextsColumn}>
                        <Text style={styles.categoryTitle}>{idCat === 0 ? 'Reajuste de valor' : cat.nome}</Text>
                        {l.descricao && (
                          <Text numberOfLines={1} style={styles.descriptionText}>
                            {l.descricao.replace(/\(\d+\/\d+\)/g, '').replace(/recurrence/g, '').replace(/\(Antecipado\)/g, '').trim()}
                          </Text>
                        )}
                        <Text numberOfLines={1} style={styles.sourceText}>{descName}</Text>

                        {(parcela || isRecorrente || isAntecipado || isAtrasado) && (
                          <View style={styles.tagsContainer}>
                            {/* NOVA TAG: Atrasado */}
                            {isAtrasado && (
                              <View style={[styles.tagBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                <Text style={[styles.tagBadgeText, { color: '#EF4444' }]}>Atrasado</Text>
                              </View>
                            )}
                            {parcela && (
                              <View style={[styles.tagBadge, { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)' }]}>
                                <Text style={[styles.tagBadgeText, { color: '#A855F7' }]}>
                                  Parcela {parcela[1]} de {parcela[2]}
                                </Text>
                              </View>
                            )}
                            {isRecorrente && (
                              <View style={[styles.tagBadge, { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)' }]}>
                                <Text style={[styles.tagBadgeText, { color: '#A855F7' }]}>Recorrente</Text>
                              </View>
                            )}
                            {isAntecipado && (
                              <View style={[styles.tagBadge, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)' }]}>
                                <Text style={[styles.tagBadgeText, { color: '#F97316' }]}>Antecipado</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    <View style={styles.rightActionsColumn}>
                      <Text style={[styles.amountValueText, { color: corValor }]}>
                        {sinal}R$ {fm(l.valor)}
                      </Text>
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity onPress={() => solicitarExclusao(l.id)} style={styles.actionBtn}>
                          <Trash2 color="#EF4444" size={16} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => alternarStatus(l.id)} style={styles.actionBtn}>
                          {l.pago ? <ThumbsUp size={16} color="#22C55E" /> : <ThumbsDown size={16} color="#EF4444" />}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* NOVO: MODAL DE BLOQUEIO */}
      <Modal visible={alertaBloqueio} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
              <Lock size={24} color="#EAB308" />
            </View>
            <Text style={styles.dialogTitle}>Edição Bloqueada</Text>
            <Text style={styles.dialogDescription}>
              Para ajustar os valores, acesse a aba "Cofrinhos" e faça um novo depósito ou resgate.
              {"\n\n"}
              Caso prefira, você também tem a opção de simplesmente apagar este lançamento.
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity onPress={() => setAlertaBloqueio(false)} style={[styles.fullWidthActionBtn, { backgroundColor: currentTheme.primary }]}>
                <Text style={[styles.fullWidthActionBtnText, { color: '#fff' }]}>Entendi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={antecipacao !== null} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <Calendar size={24} color="#F97316" />
            </View>
            <Text style={styles.dialogTitle}>Antecipar este custo?</Text>
            <Text style={styles.dialogDescription}>
              Você está liquidando um lançamento de um mês futuro. Defina a data efetiva do pagamento:
            </Text>

            <TextInput
              value={antecipacao?.dataPagamento}
              onChangeText={(txt) => antecipacao && setAntecipacao({ ...antecipacao, dataPagamento: txt })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={currentTheme.mutedForeground}
              style={styles.modalDateInput}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity onPress={() => setAntecipacao(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmarAntecipacao} style={[styles.confirmBtn, { backgroundColor: currentTheme.primary }]}>
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalExclusao !== null} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <AlertTriangle size={24} color="#EF4444" />
            </View>
            <Text style={styles.dialogTitle}>Apagar lançamento</Text>
            <Text style={styles.dialogDescription}>
              {modalExclusao?.grupoId
                ? 'Este lançamento faz parte de uma recorrência. Como deseja prosseguir com a exclusão?'
                : 'Esta ação não poderá ser desfeita. Tem certeza que deseja apagar este registro?'}
            </Text>

            <View style={{ gap: 8, width: '100%' }}>
              <TouchableOpacity
                onPress={() => executarExclusao(false)}
                style={[styles.fullWidthActionBtn, !modalExclusao?.grupoId ? { backgroundColor: '#EF4444' } : { backgroundColor: currentTheme.border }]}
              >
                <Text style={[styles.fullWidthActionBtnText, !modalExclusao?.grupoId ? { color: '#fff' } : { color: currentTheme.foreground }]}>
                  {modalExclusao?.grupoId ? 'Apenas este registro' : 'Sim, apagar registro'}
                </Text>
              </TouchableOpacity>

              {modalExclusao?.grupoId && (
                <TouchableOpacity onPress={() => executarExclusao(true)} style={[styles.fullWidthActionBtn, { backgroundColor: '#EF4444' }]}>
                  <Text style={[styles.fullWidthActionBtnText, { color: '#fff' }]}>
                    Este e os próximos lançamentos
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setModalExclusao(null)} style={styles.textCancelLink}>
                <Text style={{ color: currentTheme.mutedForeground, fontWeight: '700', fontSize: 13 }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FormLancamento
        open={formOpen || abrirLancamento != null}
        onClose={() => {
          setFormOpen(false)
          setEditandoId(null)
          onAbrirLancamentoClear?.()
        }}
        editandoId={editandoId ?? abrirLancamento}
      />
    </View>
  )
}

const { width } = Dimensions.get('window')

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  monthPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  arrowContainer: {
    padding: 10,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.foreground,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryMiddleBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.mutedForeground,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  // NOVO: Estilo para o aviso de pendência
  pendingAlertText: {
    fontSize: 9,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  filterPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.mutedForeground,
    marginTop: 40,
    fontSize: 14,
  },
  dateGroupContainer: {
    marginBottom: 12,
  },
  dateGroupHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.mutedForeground,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  itemClickableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTextsColumn: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.foreground,
  },
  descriptionText: {
    fontSize: 12,
    color: theme.mutedForeground,
    marginTop: 1,
  },
  sourceText: {
    fontSize: 11,
    color: theme.mutedForeground,
    opacity: 0.8,
    marginTop: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rightActionsColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amountValueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: theme.border,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  alertIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.foreground,
    marginBottom: 6,
    textAlign: 'center',
  },
  dialogDescription: {
    fontSize: 13,
    color: theme.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalDateInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
    color: theme.foreground,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.foreground,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  fullWidthActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidthActionBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  textCancelLink: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
})
