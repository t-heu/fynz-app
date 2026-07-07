import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from '@/lib/colors'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface ModalFullscreenProps {
  open: boolean
  onClose: () => void
  title: string
  rightAction?: React.ReactNode
  children: React.ReactNode
  backIcon?: boolean

  variant?: 'fullscreen' | 'sheet'
}

export function ModalFullscreen({
  open,
  onClose,
  title,
  rightAction,
  children,
  backIcon = false,
  variant = 'fullscreen',
}: ModalFullscreenProps) {
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  if (!open) return null

  const content = (
    <View
      style={[
        styles.container,
        variant === 'sheet' && styles.sheetContainer,
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={styles.iconButton}
        >
          {backIcon ? (
            <Ionicons
              name="chevron-back"
              size={24}
              color={currentTheme.textMuted}
            />
          ) : (
            <Ionicons
              name="close"
              size={24}
              color={currentTheme.textMuted}
            />
          )}
        </TouchableOpacity>

        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={styles.rightActionContainer}>
          {rightAction || <View style={styles.placeholder} />}
        </View>
      </View>

      <View style={styles.body}>
        {children}
      </View>
    </View>
  )

  if (variant === 'sheet') {
    return (
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.overlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />

          {content}
        </View>
      </View>
    )
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  sheetContainer: {
    flex: 0,
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.background,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 9999,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },

  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: theme.foreground,
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
    backgroundColor: theme.cardElevated,
  },
})