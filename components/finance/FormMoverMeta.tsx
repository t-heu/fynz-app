import { APP_URL } from "@/constants/vars"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from '@/lib/colors'
import { aplicarMascaraMoeda, dtISO, fm, lerValorMoeda, processarSaldoConta } from '@/lib/finance-utils'
import { ArrowDown, ArrowDownRight, ArrowUpRight, Building2, Target } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useToast } from "@/contexts/ToastContext"
import { ModalFullscreen } from '../ui/ModalFullscreen'

interface MovMetaProps {
  open: boolean
  onClose: () => void
  meta: any | null
  tipoInicial?: 'Guardar' | 'Resgatar'
}

export function FormMoverMeta({ open, onClose, meta, tipoInicial = 'Guardar' }: MovMetaProps) {
  const { dados, salvar } = useFinance()
  const colorScheme = useColorScheme()
  const { showToast } = useToast();
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const [tipo, setTipo] = useState<'Guardar' | 'Resgatar'>(tipoInicial)
  const [valorStr, setValorStr] = useState('')

  useEffect(() => {
    setTipo(tipoInicial)
    setValorStr('')
  }, [open, tipoInicial])

  const contaVinculada = useMemo(() => {
    if (!meta) return null
    return dados.contas.find((c: any) => c.id === meta.contaId) || null
  }, [meta, dados.contas])

  function salvar_() {
    if (!meta) return
    const v = lerValorMoeda(valorStr)

    if (v <= 0) {
      showToast('alert', 'Por favor, introduza um valor válido.', 'Aviso')
      return 
    }

    const novosDados = { ...dados, lancamentos: [...dados.lancamentos], metas: [...dados.metas] }
    const metaAtual = novosDados.metas.find((x: any) => x.id === meta.id)
    if (!metaAtual) return

    if (tipo === 'Guardar') {
      processarSaldoConta(novosDados, metaAtual.contaId, v, 'Despesa')
      metaAtual.depositado += v
      novosDados.lancamentos.push({ 
        id: Date.now(), 
        tipo: 'Despesa', 
        valor: v, 
        descricao: `Guardou na meta: ${metaAtual.nome}`, 
        categoriaId: 'META', 
        fonte: 'C-' + metaAtual.contaId, 
        data: dtISO(), 
        pago: true, 
        metaId: metaAtual.id, 
        movimentoMeta: 'Guardar' 
      })
    } else {
      if (v > metaAtual.depositado) {
        showToast('alert', 'Saldo insuficiente no cofrinho.', 'Erro')
        return
      }
      
      processarSaldoConta(novosDados, metaAtual.contaId, v, 'Receita')
      metaAtual.depositado -= v
      novosDados.lancamentos.push({ 
        id: Date.now(), 
        tipo: 'Receita', 
        valor: v, 
        descricao: `Resgate da meta: ${metaAtual.nome}`, 
        categoriaId: 'META', 
        fonte: 'C-' + metaAtual.contaId, 
        data: dtISO(), 
        pago: true, 
        metaId: metaAtual.id, 
        movimentoMeta: 'Resgatar' 
      })
    }
    salvar(novosDados)
    onClose()
  }

  const corAcao = tipo === 'Guardar' ? currentTheme.success : currentTheme.destructive

  return (
    <ModalFullscreen
      open={open}
      onClose={onClose}
      title={"Movimentar"}
      backIcon
      rightAction={
        <TouchableOpacity onPress={salvar_}>
          <Text style={styles.confirmBtn}>Confirmar</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Content Area */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Toggle Elegante (Segmented Control) */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              onPress={() => setTipo('Guardar')}
              style={[
                styles.toggleBtn, 
                tipo === 'Guardar' && styles.toggleBtnActive
              ]}
            >
              <ArrowUpRight size={18} color={tipo === 'Guardar' ? currentTheme.success : currentTheme.mutedForeground} />
              <Text style={[styles.toggleText, { color: tipo === 'Guardar' ? currentTheme.success : currentTheme.mutedForeground }]}>
                Guardar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setTipo('Resgatar')}
              style={[
                styles.toggleBtn, 
                tipo === 'Resgatar' && styles.toggleBtnActive
              ]}
            >
              <ArrowDownRight size={18} color={tipo === 'Resgatar' ? currentTheme.destructive : currentTheme.mutedForeground} />
              <Text style={[styles.toggleText, { color: tipo === 'Resgatar' ? currentTheme.destructive : currentTheme.mutedForeground }]}>
                Resgatar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Zona Central - Valor Gigante */}
          <View style={styles.centralInputContainer}>
            <Text style={[styles.actionLabel, { color: corAcao }]}>
              {tipo === 'Guardar' ? 'Quanto desejas guardar?' : 'Quanto desejas resgatar?'}
            </Text>
            
            <View style={[styles.balanceInputRow, { borderBottomColor: corAcao }]}>
              <Text style={[styles.currencyPrefix, { color: corAcao }]}>R$</Text>
              <TextInput
                value={valorStr}
                onChangeText={text => setValorStr(aplicarMascaraMoeda(text))}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={currentTheme.mutedForeground}
                style={styles.hugeInput}
                autoFocus={true}
              />
            </View>

            <Text style={styles.hintText}>
              {tipo === 'Guardar' 
                ? `Saldo na conta: R$ ${contaVinculada ? fm(contaVinculada.saldo) : '0,00'}`
                : `Disponível na meta: R$ ${meta ? fm(meta.depositado) : '0,00'}`
              }
            </Text>
          </View>

          {/* Cartão Informativo de Fluxo (Visual de Transferência) */}
          <View style={styles.transferCardContainer}>
            <View style={styles.transferCard}>
              
              {/* Ícone Direcional Absoluto no Centro */}
              <View style={styles.absoluteIndicatorCircle}>
                <ArrowDown size={14} color={corAcao} />
              </View>

              {/* Bloco Origem */}
              <View style={styles.cardRow}>
                <View style={styles.rowTextInfo}>
                  <Text style={styles.rowLabel}>Origem</Text>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {tipo === 'Guardar' ? contaVinculada?.nome : meta?.nome}
                  </Text>
                </View>
                
                {tipo === 'Guardar' && contaVinculada?.icone ? (
                  <View style={styles.avatarCircle}>
                    <Image source={{ uri: APP_URL + contaVinculada.icone }} style={styles.avatarImg} resizeMode="contain" />
                  </View>
                ) : tipo === 'Guardar' ? (
                  <View style={styles.avatarCircleMuted}>
                    <Building2 size={18} color={currentTheme.mutedForeground} />
                  </View>
                ) : (
                  <View style={[styles.avatarCircleMuted, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <Target size={20} color={currentTheme.success} />
                  </View>
                )}
              </View>

              {/* Divisor Visual */}
              <View style={styles.divider} />

              {/* Bloco Destino */}
              <View style={[styles.cardRow, { paddingTop: 16 }]}>
                <View style={styles.rowTextInfo}>
                  <Text style={styles.rowLabel}>Destino</Text>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {tipo === 'Guardar' ? meta?.nome : contaVinculada?.nome}
                  </Text>
                </View>

                {tipo === 'Resgatar' && contaVinculada?.icone ? (
                  <View style={styles.avatarCircle}>
                    <Image source={{ uri: APP_URL + contaVinculada.icone }} style={styles.avatarImg} resizeMode="contain" />
                  </View>
                ) : tipo === 'Resgatar' ? (
                  <View style={styles.avatarCircleMuted}>
                    <Building2 size={18} color={currentTheme.mutedForeground} />
                  </View>
                ) : (
                  <View style={[styles.avatarCircleMuted, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <Target size={20} color={currentTheme.success} />
                  </View>
                )}
              </View>

            </View>
          </View>

        </ScrollView>
      </View>
    </ModalFullscreen>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  confirmBtn: { color: theme.primary, fontSize: 16, fontWeight: '700' },

  scrollContent: { flexGrow: 1, paddingVertical: 20 },

  // Segmented Toggle
  toggleContainer: { flexDirection: 'row', backgroundColor: theme.cardElevated, marginHorizontal: 20, padding: 4, borderRadius: 16, marginBottom: 40 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  toggleBtnActive: { backgroundColor: theme.background, boxShadow: '0px 2px 8px rgba(0,0,0,0.2)' },
  toggleText: { fontSize: 14, fontWeight: '700' },

  // Input centralizado
  centralInputContainer: { alignItems: 'center', paddingHorizontal: 20, width: '100%', marginBottom: 40 },
  actionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },
  balanceInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderBottomWidth: 2, paddingBottom: 8, width: '85%', maxWidth: 320 },
  currencyPrefix: { fontSize: 36, fontWeight: '700' },
  hugeInput: { flex: 1, fontSize: 38, fontWeight: '800', color: theme.foreground, textAlign: 'center' },
  hintText: { color: theme.mutedForeground, fontSize: 14, fontWeight: '500', marginTop: 12 },

  // Cartão visual de transferência
  transferCardContainer: { paddingHorizontal: 20, marginTop: 'auto', marginBottom: 20 },
  transferCard: { backgroundColor: theme.cardElevated, borderWidth: 1, borderColor: theme.border, borderRadius: 24, padding: 20 },
  absoluteIndicatorCircle: { position: 'absolute', left: 24, top: '51%', marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 48, paddingBottom: 16 },
  rowTextInfo: { flex: 1, marginRight: 16 },
  rowLabel: { fontSize: 11, fontWeight: '600', color: theme.mutedForeground, textTransform: 'uppercase', marginBottom: 2 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: theme.foreground },
  
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  avatarImg: { width: 26, height: 26 },
  avatarCircleMuted: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  divider: { height: 1, backgroundColor: theme.border, marginLeft: 48 }
})