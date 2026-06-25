import { HomeHeader } from '@/components/finance/HomeHeader';
import { ModalDetalheCartao } from '@/components/finance/ModalDetalheCartao';
import { ModalGerenciar } from '@/components/finance/ModalGerenciar';
import { APP_URL } from '@/constants/vars'; // Assumindo que você usa isso para as URLs das imagens
import { useFinance } from '@/contexts/FinanceContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CATEGORIA_ICONS } from '@/lib/categoria-icons';
import { COLORS } from '@/lib/colors';
import { calcularSaldoComprometidoCartao, fm } from '@/lib/finance-utils';
import type { Cartao } from '@/lib/types';
import { Circle, CreditCard, Landmark, Wallet } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Função movida para fora para não recriar a cada render
const getMesAnoCard = (data: string, diaFechamento: number, isParcelado: boolean) => {
  if (!data) return { mes: -1, ano: -1 }
  const [anoStr, mesStr, diaStr] = data.split('-').map(Number)
  let mesCalculado = mesStr - 1
  let anoCalculado = anoStr
  
  if (!isParcelado && diaStr >= diaFechamento) {
    mesCalculado += 1
    if (mesCalculado > 11) {
      mesCalculado = 0
      anoCalculado += 1
    }
  }
  return { mes: mesCalculado, ano: anoCalculado }
}

export function TabHome() {
  const { dados } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const [gerenciando, setGerenciando] = useState<'Contas' | 'Cartões' | 'Categorias' | null>(null)
  const [cartaoFoco, setCartaoFoco] = useState<Cartao | null>(null)

  const { mesAtualNo, anoAtualNo, diaAtualNo } = useMemo(() => {
    const now = new Date()
    return {
      mesAtualNo: now.getMonth(),
      anoAtualNo: now.getFullYear(),
      diaAtualNo: now.getDate()
    }
  }, [])

  // OTIMIZAÇÃO: Calcula todas as faturas em uma única passada
  const faturasPorCartao = useMemo(() => {
    const lancamentos = dados.lancamentos || []
    const mapa: Record<number, number> = {}

    ;(dados.cartoes || []).forEach((c: Cartao) => {
      const cartaoId = c.id
      const diaFechamento = Number(c.fechamento) || 1

      mapa[cartaoId] = lancamentos
        .filter((l: any) => {
          if (l.fonte !== 'T-' + cartaoId && l.destinoCartao != cartaoId) return false
          if (l.tipo === 'PagamentoFatura') return false
          if (l.pago) return false 
          
          const isParcelado = /\(\d+\/\d+\)/.test(l.descricao || '')
          const dataRef = getMesAnoCard(l.data, diaFechamento, isParcelado)
          
          return dataRef.mes === mesAtualNo && dataRef.ano === anoAtualNo
        })
        .reduce((t: number, l: any) => t + l.valor, 0)
    })

    return mapa
  }, [dados.lancamentos, dados.cartoes, mesAtualNo, anoAtualNo])

  const saldoTotal = useMemo(() => {
    return (dados.contas || []).reduce((t: number, c: any) => t + (parseFloat(String(c.saldo)) || 0), 0)
  }, [dados.contas])

  const somaFaturas = useMemo(() => {
    return Object.values(faturasPorCartao).reduce((t, v) => t + v, 0)
  }, [faturasPorCartao])

  const contasOrdenadas = useMemo(() => {
    return [...(dados.contas || [])].sort((a: any, b: any) => a.nome.localeCompare(b.nome))
  }, [dados.contas])

  const cartoesOrdenados = useMemo(() => {
    return [...(dados.cartoes || [])].sort((a: any, b: any) => a.nome.localeCompare(b.nome))
  }, [dados.cartoes])

  const categoriasValidas = useMemo(() => {
    return (dados.categorias || []).filter((c: any) => c.id !== 'META' && c.id !== 'FATURA' && c.id !== 'SALARIO')
  }, [dados.categorias])

  const qtdCartoes = (dados.cartoes || []).length

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <HomeHeader />

        {/* CARDS DE RESUMO */}
        <View style={styles.summaryGrid}>
          {/* Card Saldo Geral */}
          <View style={[styles.card, styles.cardSaldo]}>
            <Text style={styles.cardLabel}>Saldo geral</Text>
            <Text 
              style={[
                styles.saldoTotalText, 
                { color: saldoTotal >= 0 ? currentTheme.primary : currentTheme.destructive }
              ]}
            >
              R$ {fm(saldoTotal)}
            </Text>
          </View>

          {/* Card Total Faturas */}
          <View style={[styles.card, styles.cardFaturas]}>
            <View style={styles.faturasHeader}>
              <Wallet size={16} color={currentTheme.mutedForeground} />
              <Text style={styles.faturasLabel}>TOTAL DE FATURAS</Text>
            </View>
            <Text style={styles.faturasValue}>R$ {fm(somaFaturas)}</Text>
            <Text style={styles.faturasSubText}>
              {qtdCartoes} {qtdCartoes !== 1 ? 'cartões cadastrados' : 'cartão cadastrado'}
            </Text>
          </View>
        </View>

        {/* SEÇÃO MINHAS CONTAS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Minhas contas</Text>

          {contasOrdenadas.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma conta cadastrada.</Text>
          )}
          
          <View style={styles.listGrid}>
            {contasOrdenadas.map((c: any) => {
              const saldoConta = parseFloat(String(c.saldo)) || 0

              return (
                <TouchableOpacity 
                  key={c.id} 
                  style={styles.listItem} 
                  activeOpacity={0.7}
                  onPress={() => setGerenciando('Contas')}
                >
                  <View style={styles.iconContainer}>
                    {c.icone ? (
                      <Image
                        source={{ uri: c.icone.includes('http') ? c.icone : APP_URL + c.icone }}
                        style={styles.iconImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Landmark size={22} color={currentTheme.mutedForeground} />
                    )}
                  </View>

                  <View style={styles.itemBody}>
                    <Text numberOfLines={1} style={styles.itemName}>{c.nome}</Text>
                  </View>
                  
                  <View style={styles.itemTrailing}>
                    <Text style={[styles.itemValue, { color: saldoConta >= 0 ? currentTheme.success : currentTheme.destructive }]}>
                      R$ {fm(saldoConta)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          <TouchableOpacity style={styles.manageBtn} onPress={() => setGerenciando('Contas')}>
            <Text style={styles.manageBtnText}>Gerenciar contas</Text>
          </TouchableOpacity>
        </View>

        {/* SEÇÃO MEUS CARTÕES */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Meus cartões</Text>
          
          {cartoesOrdenados.length === 0 && (
            <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
          )}

          <View style={styles.listGrid}>
            {cartoesOrdenados.map((c: any) => {
              const dev = faturasPorCartao[c.id] || 0 
              const comprometido = calcularSaldoComprometidoCartao(dados, c.id)
              const lim = (parseFloat(String(c.limite)) || 0) - comprometido
              const isVencido = (Number(c.vencimento) || 0) <= diaAtualNo && dev > 0

              return (
                <TouchableOpacity 
                  key={c.id}
                  activeOpacity={0.8}
                  style={[styles.cardItem, isVencido && { borderColor: currentTheme.destructive, borderWidth: 1 }]}
                  onPress={() => setCartaoFoco(c)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        {c.icone ? (
                          <Image source={{ uri: c.icone.includes('http') ? c.icone : APP_URL + c.icone }} style={{ width: 24, height: 24, borderRadius: 12 }} resizeMode="contain" />
                        ) : (
                          <CreditCard size={16} color={currentTheme.mutedForeground} />
                        )}
                      </View>
                      <View>
                        <Text numberOfLines={1} style={styles.cardName}>{c.nome}</Text>
                        <Text style={styles.cardVenc}>Venc. dia {c.vencimento || '--'}</Text>
                      </View>
                    </View>
                    <View style={styles.cardTypeBadge}>
                      <Text style={styles.cardTypeBadgeText}>CRÉDITO</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.cardLimitLabel}>Limite Disp.</Text>
                      <Text style={styles.cardLimitValue}>R$ {fm(lim)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.cardFaturaLabel, { color: dev > 0 ? currentTheme.destructive : currentTheme.success }]}>
                        {dev > 0 ? 'Fatura Atual' : 'Fatura disponível'}
                      </Text>
                      <Text style={[styles.cardFaturaValue, { color: dev > 0 ? currentTheme.destructive : currentTheme.success }]}>
                        {dev > 0 ? `-R$ ${fm(dev)}` : 'R$ 0,00'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          <TouchableOpacity style={styles.manageBtn} onPress={() => setGerenciando('Cartões')}>
            <Text style={styles.manageBtnText}>Gerenciar cartões</Text>
          </TouchableOpacity>
        </View>

        {/* SEÇÃO CATEGORIAS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          
          {categoriasValidas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma categoria encontrada.</Text>
          ) : (
            <View style={styles.categoriesGrid}>
              {categoriasValidas.map((c: any) => {
                const Icone = CATEGORIA_ICONS[c.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Circle
                
                return (
                  <TouchableOpacity 
                    key={c.id} 
                    style={styles.categoryItem}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryIconBox, {backgroundColor: c.cor + '20'}]}>
                      <Icone size={18} color={c.cor} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={styles.categoryName}>{c.nome}</Text>
                      <Text style={styles.categoryType}>{c.tipo}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
          
          <TouchableOpacity style={styles.manageBtn} onPress={() => setGerenciando('Categorias')}>
            <Text style={styles.manageBtnText}>Gerenciar categorias</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAIS */}
      <ModalGerenciar tipo={gerenciando} onClose={() => setGerenciando(null)} />
      <ModalDetalheCartao cartao={cartaoFoco} onClose={() => setCartaoFoco(null)} />
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  
  // Resumos
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginTop: 8,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
  },
  cardSaldo: {
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 13,
    color: theme.mutedForeground,
    marginBottom: 6,
  },
  saldoTotalText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardFaturas: {
    alignItems: 'center',
  },
  faturasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  faturasLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: theme.mutedForeground,
  },
  faturasValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.destructive,
    marginBottom: 2,
  },
  faturasSubText: {
    fontSize: 10,
    color: theme.mutedForeground,
  },

  // Títulos de Seção
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.foreground,
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    color: theme.mutedForeground,
    marginLeft: 4,
    marginBottom: 12,
  },

  // Listas Genéricas (Contas)
  listGrid: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent', // Pode ser theme.border se quiser todas delineadas
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.foreground,
  },
  itemTrailing: {
    marginLeft: 12,
  },
  itemValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Listas de Cartões
  cardItem: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  cardVenc: {
    fontSize: 11,
    color: theme.mutedForeground,
    marginTop: 2,
  },
  cardTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.border,
  },
  cardTypeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.mutedForeground,
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  cardLimitLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.mutedForeground,
    textTransform: 'uppercase',
  },
  cardLimitValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.foreground,
    marginTop: 2,
  },
  cardFaturaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardFaturaValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },

  // Categorias Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '48%', // Duas colunas
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.foreground,
  },
  categoryType: {
    fontSize: 11,
    color: theme.mutedForeground,
    marginTop: 1,
    textTransform: 'capitalize',
  },

  // Botões "Gerenciar"
  manageBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.primary,
  },
})