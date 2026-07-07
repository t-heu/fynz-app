import { ArrowRightLeft } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export function ModalAlertaRepeticao({ open, onClose, onConfirm, currentTheme, styles }: any) {
  if (!open) return null

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={styles.alertOverlay}>
        <View style={styles.alertBox}>
          <View style={styles.alertIconCircle}>
            <ArrowRightLeft size={24} color={currentTheme.primary} />
          </View>
          <Text style={styles.alertTitle}>Atenção!</Text>
          <Text style={styles.alertDescription}>
            Este lançamento faz parte de uma recorrência. Onde deseja aplicar esta edição?
          </Text>
          
          <View style={{ gap: 8 }}>
            <TouchableOpacity onPress={() => onConfirm(false)} style={styles.alertSecondaryBtn}>
              <Text style={styles.alertSecondaryText}>Somente neste</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(true)} style={styles.alertPrimaryBtn}>
              <Text style={styles.alertPrimaryText}>Neste e nos próximos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: currentTheme.mutedForeground, fontWeight: 'bold', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}