import { useColorScheme } from '@/hooks/use-color-scheme';
import { ArrowDownRight, ArrowUpRight, Plus, Settings, Target, Trophy } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react'; // Inclua useEffect e useRef
import { DeviceEventEmitter, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Atualize o import

import { useFinance } from '@/contexts/FinanceContext';
import { fm } from '@/lib/finance-utils';
import type { Meta } from '@/lib/types';

import { COLORS } from "@/lib/colors";
import { FormMeta } from './finance/FormMeta';
import { FormMoverMeta } from './finance/FormMoverMeta';
import { ModalFullscreen } from './ui/ModalFullscreen';

export default function TabMetas() {
  const { dados, activeTab } = useFinance()
  const colorScheme = useColorScheme()

  const [formOpen, setFormOpen] = useState(false)
  const [editandoMeta, setEditandoMeta] = useState<Meta | null>(null)
  const [detalheMeta, setDetalheMeta] = useState<Meta | null>(null)
  const [moverMeta, setMoverMeta] = useState<{ meta: Meta; tipo: 'Guardar' | 'Resgatar' } | null>(null)

  const novaMetaRef = useRef<any>(null); // Referência para o botão
  
  // 2. Adicione o listener do tour
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tour-request-target', ({ activeTab: currentTab, stepIndex }) => {
      if (currentTab !== 'metas') return;

      // Se for o passo 1 (ajuste o índice conforme necessário)
      if (stepIndex === 1) {
        novaMetaRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          DeviceEventEmitter.emit('tour-target-position', { x, y, width, height, stepIndex });
        });
      }
    });

    return () => sub.remove();
  }, [activeTab]);

  function abrirDetalhe(m: Meta) {
    setDetalheMeta(m)
  }

  function abrirFormNovo() {
    setEditandoMeta(null)
    setFormOpen(true)
  }

  function abrirEditar(m: Meta) {
    setDetalheMeta(null)
    setEditandoMeta(m)
    setFormOpen(true)
  }

  const metaAtual = detalheMeta ? (dados.metas.find(m => m.id === detalheMeta.id) || detalheMeta) : null
  const metas = dados?.metas || []

  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header do Painel */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cofrinhos</Text>
          <Text style={styles.headerSubtitle}>
            Acompanhe e alcance seus objetivos financeiros.
          </Text>
        </View>

        {/* Lista de metas */}
        <View style={styles.listContainer} ref={novaMetaRef}>
          {metas.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Trophy size={28} color={currentTheme.mutedForeground} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma meta ainda</Text>
              <Text style={styles.emptySubtitle}>Crie sua primeira meta e comece a poupar.</Text>
              <TouchableOpacity onPress={abrirFormNovo} style={styles.btnPrimary} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>Criar Primeira Meta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            [...metas].sort((a, b) => a.nome.localeCompare(b.nome)).map(m => {
              let perc = (m.depositado / m.objetivo) * 100
              if (perc > 100) perc = 100
              
              const isCompleted = perc === 100

              return (
                <TouchableOpacity
                  key={m.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => abrirDetalhe(m)}
                >
                  {/* Ícone da Meta */}
                  <View style={[
                    styles.cardIcon,
                    {
                      backgroundColor: isCompleted ? currentTheme.successLight : currentTheme.cardElevated,
                      borderColor: isCompleted ? currentTheme.success : currentTheme.border
                    }
                  ]}>
                    {isCompleted ? (
                      <Trophy size={24} color={currentTheme.success} />
                    ) : (
                      <Target size={24} color={currentTheme.primary} />
                    )}
                  </View>

                  {/* Informações */}
                  <View style={styles.cardInfo}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{m.nome}</Text>
                      <Text style={[styles.cardPercentage, { color: isCompleted ? currentTheme.success : currentTheme.primary }]}>
                        {perc.toFixed(0)}%
                      </Text>
                    </View>
                    
                    <View style={styles.rowBetweenBase}>
                      <Text style={styles.cardValue}>R$ {fm(m.depositado)}</Text>
                      <Text style={styles.cardTarget}>de R$ {fm(m.objetivo)}</Text>
                    </View>

                    {/* Barra de Progresso */}
                    <View style={styles.progressTrack}>
                      <View style={[
                        styles.progressFill,
                        {
                          width: `${perc}%`,
                          backgroundColor: isCompleted ? currentTheme.success : currentTheme.primary
                        }
                      ]} />
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })
          )}

          {metas.length > 0 && (
            <TouchableOpacity onPress={abrirFormNovo} style={styles.btnDashed} activeOpacity={0.7}>
              <Plus size={20} color={currentTheme.primary} />
              <Text style={styles.btnDashedText}>Nova Meta</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Detalhe da meta (Modal Gigante e Profissional) */}
      {metaAtual && (
        <ModalFullscreen open={true} onClose={() => setDetalheMeta(null)} title="Detalhes da Meta" backIcon>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {(() => {
              let perc = (metaAtual.depositado / metaAtual.objetivo) * 100
              if (perc > 100) perc = 100
              const isCompleted = perc === 100
              const faltam = metaAtual.objetivo - metaAtual.depositado

              return (
                <View style={styles.detailContainer}>
                  {/* Hero Section do Detalhe */}
                  <View style={[
                    styles.detailHeroIcon,
                    {
                      backgroundColor: isCompleted ? currentTheme.successLight : currentTheme.cardElevated,
                      borderColor: isCompleted ? currentTheme.success : currentTheme.primary
                    }
                  ]}>
                    {isCompleted ? (
                      <Trophy size={40} color={currentTheme.success} />
                    ) : (
                      <Target size={40} color={currentTheme.primary} />
                    )}
                  </View>
                  
                  <Text style={styles.detailTitle}>{metaAtual.nome}</Text>
                  
                  <View style={styles.detailBadgeContainer}>
                    <View style={[styles.detailBadge, { backgroundColor: isCompleted ? currentTheme.successLight : currentTheme.cardElevated }]}>
                      <Text style={[styles.detailBadgeText, { color: isCompleted ? currentTheme.success : currentTheme.primary }]}>
                        {perc.toFixed(0)}% concluído
                      </Text>
                    </View>
                  </View>

                  {/* Saldo Gigante */}
                  <View style={styles.detailBalanceContainer}>
                    <Text style={styles.detailBalanceLabel}>TOTAL GUARDADO</Text>
                    <View style={styles.detailBalanceRow}>
                      <Text style={styles.detailCurrency}>R$</Text>
                      <Text style={styles.detailAmount}>{fm(metaAtual.depositado)}</Text>
                    </View>
                    <Text style={styles.detailTargetText}>de R$ {fm(metaAtual.objetivo)}</Text>
                  </View>

                  {/* Barra de Progresso Master */}
                  <View style={styles.detailProgressContainer}>
                    <View style={styles.detailProgressTrack}>
                      <View style={[
                        styles.detailProgressFill,
                        {
                          width: `${perc}%`,
                          backgroundColor: isCompleted ? currentTheme.success : currentTheme.primary
                        }
                      ]} />
                    </View>
                    
                    {!isCompleted && faltam > 0 && (
                      <Text style={styles.detailMissingText}>
                        Faltam <Text style={styles.detailMissingAmount}>R$ {fm(faltam)}</Text> para alcançar sua meta.
                      </Text>
                    )}
                    {isCompleted && (
                      <Text style={styles.detailCompletedText}>Parabéns! Você alcançou o objetivo.</Text>
                    )}
                  </View>

                  {/* Botões de Ação (Cards Clicáveis Profissionais) */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.actionCard}
                      onPress={() => { setDetalheMeta(null); setMoverMeta({ meta: metaAtual, tipo: 'Guardar' }) }}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: currentTheme.successLight }]}>
                        <ArrowUpRight size={20} color={currentTheme.success} />
                      </View>
                      <Text style={styles.actionText}>Guardar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.actionCard}
                      onPress={() => { setDetalheMeta(null); setMoverMeta({ meta: metaAtual, tipo: 'Resgatar' }) }}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: currentTheme.dangerLight }]}>
                        <ArrowDownRight size={20} color={currentTheme.danger} />
                      </View>
                      <Text style={styles.actionText}>Resgatar</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.btnSettings}
                    onPress={() => abrirEditar(metaAtual)}
                  >
                    <Settings size={18} color={currentTheme.mutedForeground} />
                    <Text style={styles.btnSettingsText}>Editar Configurações da Meta</Text>
                  </TouchableOpacity>
                </View>
              )
            })()}
          </ScrollView>
        </ModalFullscreen>
      )}

      {/* Formulários Modal */}
      <FormMeta
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditandoMeta(null) }}
        editando={editandoMeta}
        onSaved={() => { setFormOpen(false); setEditandoMeta(null) }}
      />
      
      <FormMoverMeta
        open={!!moverMeta}
        onClose={() => setMoverMeta(null)}
        meta={moverMeta?.meta || null}
        tipoInicial={moverMeta?.tipo || 'Guardar'}
      />
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({ // Substitua 'any' por 'typeof COLORS.light' se usar TS
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.foreground,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.mutedForeground,
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  
  // Estilos de Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    borderRadius: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.foreground,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.mutedForeground,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 200,
  },
  btnPrimary: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  btnPrimaryText: {
    color: '#ffffff', // Mantido fixo pois textos em botões primários geralmente não mudam no dark mode
    fontWeight: '700',
    fontSize: 14,
  },

  // Estilos de Cartão
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardInfo: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowBetweenBase: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.foreground,
    flex: 1,
    paddingRight: 8,
  },
  cardPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.foreground,
  },
  cardTarget: {
    fontSize: 12,
    color: theme.mutedForeground,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.cardElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  btnDashed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: theme.cardElevated,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  btnDashedText: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 16,
  },

  // Modal Fullscreen Detail Styles
  modalContent: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  detailContainer: {
    width: '100%',
    maxWidth: 384, // sm do tailwind
    alignItems: 'center',
  },
  detailHeroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 3,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  detailBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  detailBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailBalanceContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  detailBalanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.mutedForeground,
    marginBottom: 8,
  },
  detailBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  detailCurrency: {
    fontSize: 24,
    color: theme.primary,
    fontWeight: '800',
  },
  detailAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.foreground,
    letterSpacing: -1,
  },
  detailTargetText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.mutedForeground,
  },
  detailProgressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  detailProgressTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.cardElevated,
    overflow: 'hidden',
    width: '100%',
  },
  detailProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  detailMissingText: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.mutedForeground,
    marginTop: 12,
    fontWeight: '500',
  },
  detailMissingAmount: {
    color: theme.foreground,
    fontWeight: '700',
  },
  detailCompletedText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: theme.success,
    marginTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.cardElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontWeight: '700',
    fontSize: 14,
    color: theme.foreground,
  },
  btnSettings: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.cardElevated,
    gap: 8,
    marginTop: 8,
  },
  btnSettingsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.mutedForeground,
  },
})