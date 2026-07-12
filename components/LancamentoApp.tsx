import { FormLancamento } from '@/components/FormLancamento'
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { CATEGORIA_ICONS } from '@/lib/categoria-icons'
import { COLORS } from '@/lib/colors'
import { dtISO, fm, formatMesAno, processarSaldoConta } from '@/lib/finance-utils'
import type { Lancamento } from '@/lib/types'
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, Circle, CircleDollarSign, Lock, Plus, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { DeviceEventEmitter, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

interface Props {
  abrirLancamento?: number | null
  onAbrirLancamentoClear?: () => void
}

export default function TabLancamentos({ abrirLancamento, onAbrirLancamentoClear }: Props) {
  const { dados, salvar, dataAtualView, mudarMes, activeTab } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [filtroPago, setFiltroPago] = useState<'todos' | 'pagos' | 'pendentes'>('todos')
  
  const [antecipacao, setAntecipacao] = useState<{ id: number; dataPagamento: string } | null>(null)
  const [modalExclusao, setModalExclusao] = useState<{ id: number; grupoId?: number } | null>(null)
  const [alertaBloqueio, setAlertaBloqueio] = useState(false)
  
  // Referências para o Walkthrough Dinâmico
  const scrollViewRef = useRef<ScrollView>(null)
  const resumoRef = useRef<View>(null)
  const filtrosRef = useRef<View>(null)
  const fabRef = useRef<any>(null)

  // Escuta os pedidos de medição para a aba de Lançamentos
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tour-request-target', ({ activeTab: currentTab, stepIndex }) => {
      if (currentTab !== 'lancamentos') return;

      let targetRef: React.RefObject<any> | null = null;

      // Mapeamento dos passos correspondentes à TabLancamentos
      if (stepIndex === 1) targetRef = resumoRef;      // Visão Geral do Mês
      else if (stepIndex === 2) targetRef = filtrosRef; // Filtros Inteligentes
      else if (stepIndex === 3) targetRef = fabRef;     // Novo Lançamento (FAB)

      if (!targetRef) {
        DeviceEventEmitter.emit('tour-target-position', null);
        return;
      }

      // Se for o FAB ou filtros, garante scroll no topo ou executa direto
      if (stepIndex === 1 || stepIndex === 2) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }

      // Aguarda o scroll estabilizar brevemente para obter as coordenadas reais na tela
      setTimeout(() => {
        targetRef?.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          DeviceEventEmitter.emit('tour-target-position', { x, y, width, height, stepIndex });
        });
      }, 300);
    });

    return () => sub.remove();
  }, [activeTab]);
  
  const hoje = dtISO()
  const mF = dataAtualView.getMonth()
  const aF = dataAtualView.getFullYear()

  const isPago = (v: any) => v === true || v === 1 || v === 'true'

  const getMesAnoReferencia = (l: Lancamento) => {
    if (!l.data) return { mes: -1, ano: -1 }
    let [anoStr, mesStr, diaStr] = l.data.split('-').map(Number)
    let mesCalculado = mesStr - 1
    let anoCalculado = anoStr

    if (l.fonte?.startsWith('T-')) {
      const cartaoId = parseInt(l.fonte.substring(2))
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

  const lancamentosView = [...lancMes, ...atrasados]

  let entradas = 0, saidas = 0, aPagar = 0
  lancamentosView.forEach(l => {
    if (l.categoriaId === 0) return 

    if (l.tipo === 'Receita') {
      entradas += l.valor
    } else if (l.tipo === 'Despesa' || l.tipo === 'PagamentoFatura') {
      saidas += l.valor
      if (!l.pago) {
        aPagar += l.valor
      }
    }
  })

  const saldoMensal = entradas - saidas

  const agrupado: Record<string, Lancamento[]> = {}
  lancamentosView.sort((a, b) => {
    const timeA = new Date(a.data).getTime()
    const timeB = new Date(b.data).getTime()
    if (timeA === timeB) {
      return b.id - a.id 
    }
    return timeB - timeA
  }).forEach(l => {
    const dt = l.data || hoje
    if (!agrupado[dt]) agrupado[dt] = []
    agrupado[dt].push(l)
  })

  function alternarStatus(id: number) {
    const novosDados = { ...dados, lancamentos: [...dados.lancamentos] }
    const l = novosDados.lancamentos.find((x: any) => x.id === id)!
    const dataLanc = new Date((l.data || hoje) + 'T12:00:00')
    const dataHoje = new Date(hoje + 'T12:00:00')
    const isMesFuturo = dataLanc.getFullYear() > dataHoje.getFullYear() || (dataLanc.getFullYear() === dataHoje.getFullYear() && dataLanc.getMonth() > dataHoje.getMonth())

    if (!l.pago && isMesFuturo) {
      setAntecipacao({ id, dataPagamento: hoje })
      return 
    }

    l.pago = !l.pago

    let contaId = l.fonte?.startsWith('C-') ? parseInt(l.fonte.substring(2)) : null

    if (l.tipo === 'PagamentoFatura' && l.fonte?.startsWith('T-')) {
        contaId = null;
    } else if (!contaId && (l.destinoCartao || l.fonte?.startsWith('T-'))) {
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

    if (l.tipo === 'PagamentoFatura') {
      novosDados.lancamentos = novosDados.lancamentos.map((x: any) => {
        if (x.faturaPagamentoId === l.id) {
          return { ...x, pago: l.pago }
        }
        return x
      })
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
    
    if (l.tipo === 'PagamentoFatura' && l.fonte?.startsWith('T-')) {
        contaId = null;
    } else if (!contaId && (l.destinoCartao || l.fonte?.startsWith('T-'))) {
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

    const getContaId = (lanc: typeof l) => {
      if (lanc.tipo === 'PagamentoFatura' && lanc.fonte?.startsWith('T-')) return null;
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
      
      if (l.tipo === 'PagamentoFatura') {
        novosDados.lancamentos = novosDados.lancamentos.map((x: any) => {
          if (x.faturaPagamentoId === l.id) {
            return {
              ...x,
              pago: false,
              faturaPagamentoId: undefined,
              descricao: x.descricao?.replace(' (Antecipado)', '').trim()
            }
          }
          return x
        })
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
      {/* HEADER DE MÊS PREMIUM */}
      <View style={styles.monthPickerRow}>
        <TouchableOpacity onPress={() => mudarMes(-1)} style={styles.arrowContainer} accessibilityLabel="Mês anterior">
          <ChevronLeft size={22} color={currentTheme.foreground} />
        </TouchableOpacity>
        <View style={styles.monthTitleWrapper}>
          <Text style={styles.monthTitle}>{formatMesAno(dataAtualView)}</Text>
        </View>
        <TouchableOpacity onPress={() => mudarMes(1)} style={styles.arrowContainer} accessibilityLabel="Próximo mês">
          <ChevronRight size={22} color={currentTheme.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* PAINEL DE RESUMO OTIMIZADO (GRID 2x2 NO MOBILE) */}
        <View ref={resumoRef} style={styles.summaryCard}>
          {/* Linha 1 */}
          <View style={[styles.summaryCol, styles.borderBottom, styles.borderRight]}>
            <Text style={styles.summaryLabel}>Entradas</Text>
            <Text numberOfLines={1} style={[styles.summaryValue, { color: '#22C55E' }]}>R$ {fm(entradas)}</Text>
          </View>
          <View style={[styles.summaryCol, styles.borderBottom]}>
            <Text style={styles.summaryLabel}>Saídas</Text>
            <Text numberOfLines={1} style={[styles.summaryValue, { color: '#EF4444' }]}>R$ {fm(saidas)}</Text>
            {atrasados.length > 0 && (
              <View style={styles.badgeAtraso}>
                <Text style={styles.textAtraso}>+ ATRASOS</Text>
              </View>
            )}
          </View>

          {/* Linha 2 */}
          <View style={[styles.summaryCol, styles.borderRight]}>
            <Text style={styles.summaryLabel}>A Pagar</Text>
            <Text numberOfLines={1} style={[styles.summaryValue, { color: '#F97316' }]}>R$ {fm(aPagar)}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Balanço</Text>
            <Text numberOfLines={1} style={[styles.summaryValue, { color: saldoMensal >= 0 ? '#22C55E' : '#EF4444' }]}>
              R$ {fm(saldoMensal)}
            </Text>
          </View>
        </View>

        {/* FILTROS SEGMENTADOS */}
        <View ref={filtrosRef} style={styles.filterPillsContainer}>
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
                  style={[
                    styles.filterPill, 
                    active ? { backgroundColor: currentTheme.primary, borderColor: 'transparent' } : { backgroundColor: 'transparent' }
                  ]}
                >
                  <Text style={[styles.filterPillText, active ? { color: '#fff' } : { color: currentTheme.mutedForeground }]}>
                     {f.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* LISTA DE LANÇAMENTOS EM CARDS */}
        {Object.keys(agrupadoFiltrado).length === 0 ? (
          <View style={styles.emptyContainer}>
             <CircleDollarSign size={48} color={currentTheme.mutedForeground} style={{ opacity: 0.5, marginBottom: 16 }} />
             <Text style={styles.emptyText}>Sem registros neste mês</Text>
          </View>
        ) : (
          Object.entries(agrupadoFiltrado).map(([dt, items]) => (
            <View key={dt} style={styles.dateGroupContainer}>
              
              {/* BADGE DE DATA */}
              <View style={styles.dateGroupHeaderRow}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>
                    {dt === hoje ? 'Hoje' : dt.split('-').reverse().join('/')}
                  </Text>
                </View>
                <View style={styles.dateHeaderLine} />
              </View>
              
              <View style={styles.itemsListGap}>
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
                  const destacado = dt <= hoje && !l.pago

                  const parcela = (l.descricao || '').match(/\((\d+)\/(\d+)\)/)
                  const isRecorrente = (l.descricao || '').includes('recurrence')
                  const isAntecipado = (l.descricao || '').includes('(Antecipado)')
                  
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
                        destacado
                          ? { borderColor: currentTheme.primary, backgroundColor: `${currentTheme.primary}12`, borderWidth: 1 }
                          : { borderColor: currentTheme.border, backgroundColor: currentTheme.card }
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          if (l.metaId || l.categoriaId === 'META' || l.categoriaId === 0) {
                            setAlertaBloqueio(true);
                            return;
                          }
                          abrirEditar(l.id);
                        }}
                        style={styles.itemClickableArea}
                      >
                        <View style={[styles.iconBox, { backgroundColor: idCat === 0 ? 'rgba(51,51,51,0.1)' : `${cat.cor}18` }]}>
                          {idCat === 0 ? (
                            <CircleDollarSign size={20} color="#22C55E" />
                          ) : (
                            <Icone size={20} color={cat.cor} />
                          )}
                        </View>
                        
                        <View style={styles.metaTextsColumn}>
                          <Text numberOfLines={1} style={styles.categoryTitle}>
                            {idCat === 0 ? 'Reajuste de valor' : cat.nome}
                          </Text>
                          {l.descricao && (
                            <Text numberOfLines={1} style={styles.descriptionText}>
                              {l.descricao.replace(/\(\d+\/\d+\)/g, '').replace(/recurrence/g, '').replace(/\(Antecipado\)/g, '').trim()}
                            </Text>
                          )}
                          <Text numberOfLines={1} style={styles.sourceText}>{descName}</Text>

                          {(parcela || isRecorrente || isAntecipado || isAtrasado) && (
                            <View style={styles.tagsContainer}>
                              {isAtrasado && (
                                <View style={[styles.tagBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 0.5, borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                  <Text style={[styles.tagBadgeText, { color: '#EF4444' }]}>Atrasado</Text>
                                </View>
                              )}
                              {parcela && (
                                <View style={[styles.tagBadge, { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 0.5, borderColor: 'rgba(168, 85, 247, 0.2)' }]}>
                                  <Text style={[styles.tagBadgeText, { color: '#A855F7' }]}>
                                    Parcela {parcela[1]} de {parcela[2]}
                                  </Text>
                                </View>
                              )}
                              {isRecorrente && (
                                <View style={[styles.tagBadge, { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 0.5, borderColor: 'rgba(168, 85, 247, 0.2)' }]}>
                                  <Text style={[styles.tagBadgeText, { color: '#A855F7' }]}>Recorrente</Text>
                                </View>
                              )}
                              {isAntecipado && (
                                <View style={[styles.tagBadge, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderWidth: 0.5, borderColor: 'rgba(249, 115, 22, 0.2)' }]}>
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
                          <TouchableOpacity onPress={() => solicitarExclusao(l.id)} style={styles.actionBtn} accessibilityLabel="Apagar">
                            <Trash2 color={currentTheme.mutedForeground} size={15} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => alternarStatus(l.id)} style={styles.actionBtn} accessibilityLabel="Mudar Status">
                            {l.pago ? <ThumbsUp size={15} color="#22C55E" /> : <ThumbsDown size={15} color="#EF4444" />}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL DE BLOQUEIO */}
      <Modal transparent animationType="fade" visible={alertaBloqueio} onRequestClose={() => setAlertaBloqueio(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
              <Lock size={26} color="#EAB308" />
            </View>
            <Text style={styles.dialogTitle}>Edição Bloqueada</Text>
            <Text style={styles.dialogDescription}>
              Para editar valores fixos ou saldos, acesse a aba correspondente na tela inicial (<Text style={{ fontWeight: '700', color: currentTheme.foreground }}>Cofrinhos</Text> ou <Text style={{ fontWeight: '700', color: currentTheme.foreground }}>Gerenciar Contas</Text>).
              {"\n\n"}
              Caso prefira, você também tem a opção de simplesmente apagar este lançamento no ícone da lixeira.
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity onPress={() => setAlertaBloqueio(false)} style={[styles.fullWidthActionBtn, { backgroundColor: currentTheme.primary }]}>
                <Text style={[styles.fullWidthActionBtnText, { color: '#fff' }]}>Entendi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ANTECIPAÇÃO */}
      <Modal transparent animationType="fade" visible={antecipacao !== null} onRequestClose={() => setAntecipacao(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <Calendar size={24} color="#F97316" />
            </View>
            <Text style={styles.dialogTitle}>Antecipar Custo?</Text>
            <Text style={styles.dialogDescription}>
              Você está pagando uma conta de um mês futuro. Selecione a data exata do pagamento para que o valor saia do seu saldo na data correta.
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

      {/* MODAL DE EXCLUSÃO */}
      <Modal transparent animationType="fade" visible={modalExclusao !== null} onRequestClose={() => setModalExclusao(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <AlertTriangle size={24} color="#EF4444" />
            </View>
            <Text style={styles.dialogTitle}>Apagar Lançamento</Text>
            <Text style={styles.dialogDescription}>
              {modalExclusao?.grupoId
                ? 'Este lançamento faz parte de uma recorrência. Como deseja prosseguir com a exclusão?'
                : 'Esta ação não poderá ser desfeita. Tem certeza que deseja apagar este registro permanentemente?'}
            </Text>

            <View style={{ gap: 10, width: '100%' }}>
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
                    Este e os próximos
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

      {/* BOTÃO FLUTUANTE */}
      <TouchableOpacity
        ref={fabRef}
        onPress={() => setFormOpen(true)}
        style={styles.fab}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

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

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 99,
  },
  monthPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  arrowContainer: {
    padding: 8,
    borderRadius: 20,
  },
  monthTitleWrapper: {
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.foreground,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  summaryCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryCol: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: theme.border,
  },
  summaryLabel: {
    fontSize: 10,
    color: theme.mutedForeground,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
    paddingHorizontal: 4,
  },
  badgeAtraso: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  textAtraso: {
    fontSize: 8,
    color: '#EF4444',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  filterPillsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  filterPillsRow: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: theme.border,
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 48,
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.border,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  dateGroupContainer: {
    marginBottom: 16,
  },
  dateGroupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  dateBadge: {
    backgroundColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: theme.mutedForeground,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
    opacity: 0.4,
  },
  itemsListGap: {
    gap: 10,
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  itemClickableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    marginTop: 2,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.mutedForeground,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rightActionsColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amountValueText: {
    fontSize: 14,
    fontWeight: '900',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 7,
    backgroundColor: theme.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: theme.card,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  alertIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogDescription: {
    fontSize: 13,
    color: theme.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalDateInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
    color: theme.foreground,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: theme.foreground,
    fontWeight: '700',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  fullWidthActionBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthActionBtnText: {
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textCancelLink: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 2,
  },
})