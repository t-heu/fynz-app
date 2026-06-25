import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from "@/lib/colors"
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

interface ModalFullscreenProps {
  open: boolean
  onClose: () => void
  title: string
  rightAction?: React.ReactNode
  children: React.ReactNode
  zIndex?: number // No Mobile, o componente Modal nativo já sobrepõe tudo automaticamente
  backIcon?: boolean
}

export function ModalFullscreen({
  open,
  onClose,
  title,
  rightAction,
  children,
  backIcon = false,
}: ModalFullscreenProps) {
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose} // Trata o botão "voltar" físico do Android
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {/* Botão Esquerdo (Fechar / Voltar) */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={styles.iconButton}
            accessibilityLabel={backIcon ? 'Voltar' : 'Fechar'}
          >
            {backIcon ? (
              <Ionicons name="chevron-back" size={24} color={currentTheme.textMuted} />
            ) : (
              <Ionicons name="close" size={24} color={currentTheme.textMuted} />
            )}
          </TouchableOpacity>

          {/* Título Centralizado */}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {/* Ação Direita (ou espaço vazio para equilibrar o Flexbox) */}
          <View style={styles.rightActionContainer}>
            {rightAction || <View style={styles.placeholder} />}
          </View>
        </View>

        {/* Body Content */}
        <View style={styles.body}>
          {children}
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.border, // Substituído
    backgroundColor: theme.background, // Substituído
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.foreground, // Substituído
    flex: 1,
    textAlign: 'center',
  },
  rightActionContainer: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  body: {
    flex: 1,
    backgroundColor: theme.cardElevated, // Substituído (ou theme.background, dependendo do contraste desejado)
  },
})
