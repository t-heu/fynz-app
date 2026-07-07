import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from '@/lib/colors'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ModalManualProps {
  open: boolean
  onClose: () => void
  title?: string
  headerRight?: React.ReactNode 
  headerLeft?: React.ReactNode  
  children: React.ReactNode     
}

export function ModalManual({ 
  open, 
  onClose, 
  title, 
  headerRight, 
  headerLeft, 
  children 
}: ModalManualProps) {
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)
  
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const viewRef = useRef<View>(null)
  
  // Controle de renderização interna para permitir a animação de fechamento
  const [shouldRender, setShouldRender] = useState(open)
  const [layoutCoords, setLayoutCoords] = useState<{ top: number; left: number } | null>(null)
  
  // Cria o valor da animação começando na base da tela (escondido embaixo)
  const animY = useRef(new Animated.Value(windowHeight)).current

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      setLayoutCoords(null)
      animY.setValue(windowHeight) // Garante que começa totalmente abaixo da tela
    } else {
      // Quando fechar, desliza para baixo antes de desmontar o componente
      Animated.timing(animY, {
        toValue: windowHeight,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false)
      })
    }
  }, [open, windowHeight, animY])

  useEffect(() => {
    // Assim que a medição for concluída e o modal estiver aberto, desliza para cima
    if (layoutCoords && open) {
      Animated.timing(animY, {
        toValue: 0,
        duration: 280, // Velocidade suave de transição
        useNativeDriver: true,
      }).start()
    }
  }, [layoutCoords, open, animY])

  if (!shouldRender) return null

  const isMeasured = layoutCoords !== null

  // Aplica o posicionamento absoluto global apenas após medir
  const dynamicOverlayStyle = isMeasured
    ? {
        position: 'absolute' as const,
        top: -layoutCoords!.top,
        left: -layoutCoords!.left,
        width: windowWidth,
        height: windowHeight,
        transform: [{ translateY: animY }], // Controla a subida/descida fluida
      }
    : {
        ...StyleSheet.absoluteFillObject,
        opacity: 0, // Totalmente invisível e inofensivo no frame de cálculo
      }

  const handleLayout = () => {
    if (!isMeasured) {
      viewRef.current?.measureInWindow((x, y) => {
        setLayoutCoords({ top: y, left: x })
      })
    }
  }

  return (
    <Animated.View 
      ref={viewRef}
      onLayout={handleLayout}
      style={[styles.manualModalWrapper, dynamicOverlayStyle]}
      onTouchStart={(e) => e.stopPropagation()} // Evita cliques fantasmas passando para trás
    >
      <SafeAreaView style={styles.container}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View style={styles.headerActionLeft}>
            {headerLeft ? (
              headerLeft
            ) : (
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Text style={styles.cancelBtn}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          
          <View style={styles.headerActionRight}>
            {headerRight || <View style={{ width: 10 }} />}
          </View>
        </View>

        {/* CONTEÚDO */}
        <View style={{ flex: 1 }}>
          {children}
        </View>

      </SafeAreaView>
    </Animated.View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  manualModalWrapper: {
    backgroundColor: theme.background,
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
    minHeight: 60,
    //backgroundColor: '#eee',
  },
  headerActionLeft: {
    minWidth: 70,
    alignItems: 'flex-start',
  },
  headerActionRight: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  cancelBtn: { 
    color: theme.mutedForeground, 
    fontSize: 16 
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.foreground,
    textAlign: 'center',
    flex: 1,
  },
})