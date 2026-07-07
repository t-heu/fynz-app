import { APP_URL } from "@/constants/vars"
import { bancos } from '@/lib/bancos'
import { CATEGORIA_ICONS } from '@/lib/categoria-icons'
import { Check, Landmark, Plus, Tags, WalletCards, X } from 'lucide-react-native'
import React from 'react'
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { width } = Dimensions.get('window')
const FREQS = ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual']

export function SheetSeletoresLancamento({
  openDrawer, setOpenDrawer, currentTheme, styles,
  cats, categoriaId, setCategoriaId, setShowFormCat,
  contasOrd, cartoesOrd, fonte, setFonte,
  repType, setRepType, repFreq, setRepFreq, qtdParcelas, setQtdParcelas
}: any) {
  if (openDrawer === null) return null

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={styles.drawerOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setOpenDrawer(null)} />
        <View style={styles.drawerContentContainer}>
          <View style={styles.drawerIndicatorRow}><View style={styles.drawerIndicator} /></View>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>
              {openDrawer === 'categoria' ? 'Selecione a Categoria' : openDrawer === 'fonte' ? 'Qual a Origem?' : 'Configurar Repetição'}
            </Text>
            <TouchableOpacity onPress={() => setOpenDrawer(null)} style={styles.drawerCloseIcon}>
              <X size={18} color={currentTheme.foreground} />
            </TouchableOpacity>
          </View>

          {openDrawer === 'categoria' && (
            <ScrollView style={{ paddingHorizontal: 16, marginBottom: 24 }}>
              <TouchableOpacity onPress={() => { setOpenDrawer(null); setShowFormCat(true) }} style={styles.drawerCreateBtn}>
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
                      <TouchableOpacity key={c.id} onPress={() => { setCategoriaId(String(c.id)); setOpenDrawer(null) }} style={[styles.drawerItemCard, isSelected && { borderColor: currentTheme.primary, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }]}>
                        <View style={[styles.iconBox, { backgroundColor: `${c.cor}20` }]}><CatIcon size={20} color={c.cor} /></View>
                        <Text style={styles.drawerItemText}>{c.nome}</Text>
                        {isSelected && <Check size={20} color={currentTheme.primary} />}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </ScrollView>
          )}

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
                        <TouchableOpacity key={`C-${c.id}`} onPress={() => { setFonte(`C-${c.id}`); setOpenDrawer(null) }} style={[styles.drawerItemCard, isSelected && { borderColor: currentTheme.primary }]}>
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
                        <TouchableOpacity key={`T-${c.id}`} onPress={() => { setFonte(`T-${c.id}`); setOpenDrawer(null) }} style={[styles.drawerItemCard, isSelected && { borderColor: currentTheme.primary }]}>
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

          {openDrawer === 'repeticao' && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
              <View style={styles.repTabsBox}>
                {(['Unico', 'Fixo', 'Parcelado'] as const).map(t => (
                  <TouchableOpacity key={t} onPress={() => setRepType(t)} style={[styles.repTabBtn, repType === t && { backgroundColor: currentTheme.primary }]}>
                    <Text style={[styles.repTabBtnText, repType === t ? { color: '#fff' } : { color: currentTheme.mutedForeground }]}>{t === 'Unico' ? 'Não Repetir' : t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {repType !== 'Unico' && (
                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={styles.drawerSectionHeader}>Frequência da Repetição</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                      {FREQS.map(f => (
                        <TouchableOpacity key={f} onPress={() => setRepFreq(f)} style={[styles.freqBubble, repFreq === f && { borderColor: currentTheme.primary, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }]}>
                          <Text style={[styles.freqBubbleText, { color: repFreq === f ? currentTheme.primary : currentTheme.foreground }]}>{f}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  {repType === 'Parcelado' && (
                    <View>
                      <Text style={styles.drawerSectionHeader}>Quantidade de Parcelas</Text>
                      <ScrollView contentContainerStyle={styles.parcelasGrid} style={{ maxHeight: 160 }}>
                        {Array.from({ length: 48 }, (_, i) => i + 1).map(p => (
                          <TouchableOpacity key={p} onPress={() => setQtdParcelas(String(p))} style={[styles.parcelaGridItem, String(p) === qtdParcelas ? { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary } : { backgroundColor: currentTheme.border, borderColor: 'transparent' }]}>
                            <Text style={[styles.parcelaGridItemText, String(p) === qtdParcelas ? { color: '#fff' } : { color: currentTheme.foreground }]}>{p}x</Text>
                          </TouchableOpacity>
                        ))}
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
  )
}
