import { ModalManual } from '@/components/ui/ModalManual'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from "@/lib/colors"
import { dtISO } from '@/lib/finance-utils'
import { AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

interface Props {
  open: boolean
  onClose: () => void
  isAntecipacaoMode: boolean
  itensCount: number
  valorPersonalizado: string
  onConfirmar: (dataConfirmada: string) => void
}

export function SheetConfirmacaoData({ open, onClose, isAntecipacaoMode, itensCount, valorPersonalizado, onConfirmar }: Props) {
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)
  
  const [dataPagamento, setDataPagamento] = useState(dtISO())

  useEffect(() => {
    if (open) setDataPagamento(dtISO())
  }, [open])

  return (
    <ModalManual
      open={open}
      onClose={onClose}
      title={isAntecipacaoMode ? 'Antecipação de Gastos' : 'Confirmar Pagamento'}
      headerLeft={
        <TouchableOpacity onPress={onClose}>
          <ChevronLeft size={24} color={currentTheme.foreground} />
        </TouchableOpacity>
      }
    >
      <View style={styles.bottomSheetWrapper}>
        <View style={styles.bottomSheetContent}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={styles.alertIconCircle}>
              {isAntecipacaoMode 
                ? <AlertCircle size={24} color={currentTheme.primary} /> 
                : <CheckCircle2 size={24} color={currentTheme.primary} />}
            </View>
            <Text style={[styles.alertDescription, { textAlign: 'center', marginTop: 16 }]}>
              {isAntecipacaoMode 
                ? `Você selecionou ${itensCount} gasto(s) de uma fatura futura para quitar. Eles receberão o selo de "Antecipado" e serão movidos para a data abaixo:`
                : `Você está pagando ${itensCount} gasto(s) debitando um total de R$ ${valorPersonalizado}. Confirme ou altere a data de pagamento abaixo:`
              }
            </Text>
          </View>
          
          <TextInput
            style={styles.alertInput}
            value={dataPagamento}
            onChangeText={setDataPagamento}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={currentTheme.mutedForeground}
          />

          <TouchableOpacity style={styles.alertPrimaryBtn} onPress={() => onConfirmar(dataPagamento)}>
            <Text style={styles.alertPrimaryText}>
              {isAntecipacaoMode ? 'Sim, confirmar antecipação' : 'Confirmar pagamento'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.alertSecondaryBtn} onPress={onClose}>
            <Text style={styles.alertSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalManual>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  bottomSheetWrapper: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheetContent: { backgroundColor: theme.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  alertIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  alertDescription: { fontSize: 14, color: theme.mutedForeground, marginBottom: 20, lineHeight: 20 },
  alertInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, fontSize: 16, color: theme.foreground, marginBottom: 24, backgroundColor: theme.background },
  alertPrimaryBtn: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  alertPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  alertSecondaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  alertSecondaryText: { color: theme.mutedForeground, fontWeight: 'bold', fontSize: 12 },
})