import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { CATEGORIA_ICONS } from '@/lib/categoria-icons'
import { COLORS } from "@/lib/colors"
import { dtISO, fm, formatMesAno } from '@/lib/finance-utils'
import { ChevronLeft, ChevronRight, Circle, TrendingDown, TrendingUp } from 'lucide-react-native'
import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DonutChart from './DonutChart'
import { ModalFullscreen } from './finance/ModalFullscreen'

export default function TabRelatorios() {
  const { dados, dataAtualView, mudarMes } = useFinance()
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light;

  const hoje = dtISO()
  const [tipoFiltro, setTipoFiltro] = useState<'Despesa' | 'Receita'>('Despesa')
  const [catDetalhe, setCatDetalhe] = useState<any | null>(null)

  const mF = dataAtualView.getMonth()
  const aF = dataAtualView.getFullYear()

  const lancMes = useMemo(() => {
    return (dados.lancamentos || []).filter(l => {
      const d = new Date((l.data || hoje) + 'T12:00:00')
      return d.getMonth() === mF && d.getFullYear() === aF && !l.silencioso
    })
  }, [dados.lancamentos, mF, aF, hoje])

  const { dadosGrafico, totalValor } = useMemo(() => {
    const totCat: Record<string, number> = {}
    let total = 0
    
    lancMes
      .filter(l => l.tipo === tipoFiltro && l.categoriaId !== 'FATURA' && l.categoriaId !== 'META')
      .forEach(l => {
        const cat = (dados.categorias || []).find(x => x.id == l.categoriaId)
        if (cat) {
          totCat[cat.nome] = (totCat[cat.nome] || 0) + l.valor
          total += l.valor
        }
      })

    const grafico = Object.keys(totCat).map(n => {
      const c = (dados.categorias || []).find(x => x.nome === n)
      return { id: c?.id || '', nome: n, valor: totCat[n], cor: c?.cor || '#888', icone: c?.icone || '🏷️' }
    }).sort((a, b) => b.valor - a.valor)

    return { dadosGrafico: grafico, totalValor: total }
  }, [lancMes, tipoFiltro, dados.categorias])

  const formatCompact = (valor: number) => {
    if (valor >= 1e6) return `${(valor / 1e6).toFixed(1)}M`
    if (valor >= 1e3) return `${(valor / 1e3).toFixed(1)}K`
    return fm(valor)
  }

  const lancamentosDetalhados = catDetalhe 
    ? lancMes
        .filter(l => l.categoriaId == catDetalhe.id && l.tipo === tipoFiltro)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    : []

  const corDestaque = tipoFiltro === 'Despesa' ? currentTheme.destructive : currentTheme.success

  const styles = getStyles(currentTheme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
        <View style={styles.navMes}>
          <TouchableOpacity onPress={() => mudarMes(-1)}><ChevronLeft size={24} color={currentTheme.foreground} /></TouchableOpacity>
          <Text style={styles.mesTexto}>{formatMesAno(dataAtualView)}</Text>
          <TouchableOpacity onPress={() => mudarMes(1)}><ChevronRight size={24} color={currentTheme.foreground} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity onPress={() => setTipoFiltro('Despesa')} style={[styles.toggleBtn, tipoFiltro === 'Despesa' && styles.toggleActiveDespesa]}>
          <TrendingDown size={18} color={tipoFiltro === 'Despesa' ? currentTheme.destructive : currentTheme.mutedForeground} />
          <Text style={{ color: tipoFiltro === 'Despesa' ? currentTheme.destructive : currentTheme.mutedForeground, fontWeight: 'bold' }}>Despesas</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTipoFiltro('Receita')} style={[styles.toggleBtn, tipoFiltro === 'Receita' && styles.toggleActiveReceita]}>
          <TrendingUp size={18} color={tipoFiltro === 'Receita' ? currentTheme.success : currentTheme.mutedForeground} />
          <Text style={{ color: tipoFiltro === 'Receita' ? currentTheme.success : currentTheme.mutedForeground, fontWeight: 'bold' }}>Ganhos</Text>
        </TouchableOpacity>
      </View>

      {/* Placeholder para gráfico: substitua por um componente de biblioteca SVG como Victory */}
      <View style={styles.graficoContainer}>
        {dadosGrafico.length > 0 ? (
          <DonutChart
            data={dadosGrafico}
            total={totalValor}
            corDestaque={corDestaque}
            tipoFiltro={tipoFiltro}
            formatCompact={formatCompact}
          />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: currentTheme.mutedForeground }}>
              Nenhum dado
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.listaCategorias}>
        {dadosGrafico.map(d => (
          <TouchableOpacity key={d.nome} onPress={() => setCatDetalhe(d)} style={styles.catCard}>
            <View style={[styles.iconBox, { backgroundColor: d.cor + '40' }]}>
              {/* O mapeamento de ícone precisaria ser ajustado para retornar um componente React Native */}
              {(() => {
                const Icone = CATEGORIA_ICONS[d.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Circle;
                return <Icone size={20} color={d.cor} />;
              })()}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: currentTheme.foreground, fontWeight: 'bold' }}>{d.nome}</Text>
              <Text style={{ color: currentTheme.mutedForeground, fontSize: 11 }}>{((d.valor / totalValor) * 100).toFixed(1)}%</Text>
            </View>
            <Text style={{ color: currentTheme.foreground, fontWeight: 'bold' }}>R$ {fm(d.valor)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ModalFullscreen open={!!catDetalhe} onClose={() => setCatDetalhe(null)} title="Detalhes da Categoria">
        {catDetalhe && (
          <ScrollView style={{ flex: 1, backgroundColor: currentTheme.background }}>
            {/* Cabeçalho do Detalhe */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: catDetalhe.cor + '30', borderColor: catDetalhe.cor }]}>
                {/* Certifique-se que o componente Icone venha de lucide-react-native */}
                {(() => {
                  const Icone = CATEGORIA_ICONS[catDetalhe.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Circle;
                  return <Icone size={36} color={catDetalhe.cor} />;
                })()}
              </View>
              <Text style={styles.modalTitle}>{catDetalhe.nome}</Text>
              <View style={[styles.modalBadge, { backgroundColor: catDetalhe.cor + '20' }]}>
                <Text style={[styles.modalBadgeText, { color: catDetalhe.cor }]}>
                  {tipoFiltro === 'Despesa' ? 'Gasto Mensal:' : 'Ganho Mensal:'} R$ {fm(catDetalhe.valor)}
                </Text>
              </View>
            </View>

            {/* Lista de Transações */}
            <View style={styles.modalListContainer}>
              <Text style={styles.modalListHeader}>HISTÓRICO DE LANÇAMENTOS</Text>
              
              {lancamentosDetalhados.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum lançamento encontrado.</Text>
              ) : (
                lancamentosDetalhados.map(l => {
                  const sinal = tipoFiltro === 'Receita' ? '+' : '-'
                  const corValor = tipoFiltro === 'Receita' ? currentTheme.success : currentTheme.foreground
                  const parcela = (l.descricao || '').match(/\((\d+)\/(\d+)\)/)
                  const isRecorrente = (l.descricao || '').includes('recurrence')
                  
                  // Lógica para nome da conta/cartão
                  let fontNome = 'Não informado'
                  if (l.fonte?.startsWith('C-')) {
                    const c = dados.contas?.find((x: any) => x.id === parseInt(l.fonte!.substring(2)))
                    if (c) fontNome = c.nome
                  } else if (l.fonte?.startsWith('T-')) {
                    const t = dados.cartoes?.find((x: any) => x.id === parseInt(l.fonte!.substring(2)))
                    if (t) fontNome = t.nome
                  }

                  return (
                    <View key={l.id} style={styles.lancItem}>
                      <View style={styles.lancHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.lancDesc} numberOfLines={1}>
                            {l.descricao ? l.descricao.replace(/\(\d+\/\d+\)/g, '').replace(/recurrence/g, '').trim() : catDetalhe.nome}
                          </Text>
                          <Text style={styles.lancMeta}>{(l.data || hoje).split('-').reverse().join('/')} • {fontNome}</Text>
                        </View>
                        <Text style={[styles.lancValor, { color: corValor }]}>{sinal}R$ {fm(l.valor)}</Text>
                      </View>

                      {(parcela || isRecorrente) && (
                        <View style={styles.tagRow}>
                          {parcela && (
                            <View style={styles.tag}>
                              <Text style={styles.tagText}>Parcela {parcela[1]} de {parcela[2]}</Text>
                            </View>
                          )}
                          {isRecorrente && (
                            <View style={styles.tag}>
                              <Text style={styles.tagText}>Recorrente</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )
                })
              )}
            </View>
          </ScrollView>
        )}
      </ModalFullscreen>
    </ScrollView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    padding: 20, 
    paddingTop: 40 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: theme.foreground, 
    marginBottom: 20 
  },
  navMes: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: theme.card, 
    padding: 10, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  mesTexto: { 
    color: theme.foreground, 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  toggleContainer: { 
    flexDirection: 'row', 
    padding: 20, 
    gap: 10 
  },
  toggleBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 12, 
    borderRadius: 12, 
    backgroundColor: theme.cardElevated 
  },
  toggleActiveDespesa: { 
    backgroundColor: theme.background, 
    borderWidth: 1, 
    borderColor: theme.danger 
  },
  toggleActiveReceita: { 
    backgroundColor: theme.background, 
    borderWidth: 1, 
    borderColor: theme.success 
  },
  graficoContainer: {
    height: 220,
    backgroundColor: theme.card,
    margin: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  listaCategorias: { 
    paddingHorizontal: 20 
  },
  catCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.cardElevated, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 10 
  },
  iconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  modalHeader: { 
    padding: 20, 
    paddingTop: 40, 
    alignItems: 'center' 
  },
  modalIconBox: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: theme.foreground, 
    marginBottom: 8 
  },
  modalBadge: { 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  modalBadgeText: { 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  modalListContainer: { 
    backgroundColor: theme.card, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 20, 
    minHeight: 400 
  },
  modalListHeader: { 
    color: theme.mutedForeground, 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  emptyText: { 
    color: theme.mutedForeground, 
    textAlign: 'center', 
    marginTop: 40 
  },
  lancItem: { 
    backgroundColor: theme.background, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: theme.cardElevated 
  },
  lancHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  lancDesc: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: theme.foreground 
  },
  lancMeta: { 
    fontSize: 12, 
    color: theme.mutedForeground, 
    marginTop: 4 
  },
  lancValor: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  tagRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: theme.cardElevated 
  },
  tag: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    borderColor: theme.primary, 
    borderWidth: 1 
  },
  tagText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: theme.primary, 
    textTransform: 'uppercase' 
  },
})
