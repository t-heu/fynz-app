import React, { useState } from 'react'
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

interface Props {
  onApply: (valor: number) => void
}

const THEME = {
  bg: '#0f172a',
  displayBg: '#1e293b',
  border: 'rgba(255,255,255,.05)',
  equalBg: '#7c3aed',
  operatorBg: 'rgba(96,165,250,.12)',
  actionBg: 'rgba(239,68,68,.12)',
  numBg: 'rgba(255,255,255,.04)',
  equalText: '#fff',
  operatorText: '#60a5fa',
  actionText: '#f87171',
  numText: '#f8fafc',
}

export function CalculadoraFinanceira({ onApply }: Props) {
  const [calcVal, setCalcVal] = useState('0')
  const [calcOp, setCalcOp] = useState('')
  const [calcPrev, setCalcPrev] = useState(0)
  const [aguardandoNovoNumero, setAguardandoNovoNumero] = useState(false)
  const [calcPending, setCalcPending] = useState<number | null>(null)
  const [calcPendingOp, setCalcPendingOp] = useState('')

  function aplicarOperacao(a: number, b: number, op: string) {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b === 0 ? 0 : a / b
      default: return b
    }
  }

  function resolverPendencia(pending: number, atual: number, op: string) {
    switch (op) {
      case '*': return pending * atual
      case '/': return atual === 0 ? 0 : pending / atual
      default: return atual
    }
  }

  function calcBtn(v: string) {
    if (v === 'CE') {
      setCalcVal(prev => {
        if (prev.length <= 1) return '0'
        const novo = prev.slice(0, -1)
        return novo === '' || novo === '-' ? '0' : novo
      })
      return
    }

    if (v === 'C') {
      setCalcVal('0')
      setCalcOp('')
      setCalcPrev(0)
      setCalcPending(null)
      setCalcPendingOp('')
      setAguardandoNovoNumero(false)
      return
    }

    if (v === ',') {
      if (aguardandoNovoNumero) {
        setCalcVal('0.')
        setAguardandoNovoNumero(false)
      } else if (!calcVal.includes('.')) {
        setCalcVal(prev => prev + '.')
      }
      return
    }

    if (v === '=') {
      const atual = parseFloat(calcVal) || 0
      let resultado = atual

      if (calcOp) {
        resultado = aplicarOperacao(calcPrev, atual, calcOp)
      }

      setCalcVal(String(resultado))
      setCalcOp('')
      setAguardandoNovoNumero(true)
      onApply(resultado)
      return
    }

    if (['+', '-', '*', '/'].includes(v)) {
      const atual = parseFloat(calcVal) || 0

      if (calcPendingOp) {
        const resolvido = resolverPendencia(
          calcPending as number,
          atual,
          calcPendingOp
        )

        setCalcPending(null)
        setCalcPendingOp('')

        if (calcOp === '+') setCalcPrev(calcPrev + resolvido)
        if (calcOp === '-') setCalcPrev(calcPrev - resolvido)
        if (!calcOp) setCalcPrev(resolvido)
      } else {
        if (calcOp === '+') setCalcPrev(calcPrev + atual)
        if (calcOp === '-') setCalcPrev(calcPrev - atual)
        if (calcOp === '*') {
          setCalcPending(calcPrev)
          setCalcPendingOp('*')
        }
        if (calcOp === '/') {
          setCalcPending(calcPrev)
          setCalcPendingOp('/')
        }
        if (!calcOp) setCalcPrev(atual)
      }

      setCalcOp(v)
      setAguardandoNovoNumero(true)
      return
    }

    if (aguardandoNovoNumero) {
      setCalcVal(v)
      setAguardandoNovoNumero(false)
    } else {
      setCalcVal(prev => (prev === '0' ? v : prev + v))
    }
  }

  const formatarVisor = (str: string) => str.replace('.', ',')
  const formatarNumVisor = (num: number) => String(num).replace('.', ',')

  let visorTexto = formatarVisor(calcVal)
  const opSinal = calcOp === '*' ? '×' : calcOp === '/' ? '÷' : calcOp

  if (calcOp && aguardandoNovoNumero) {
    visorTexto = `${formatarNumVisor(calcPrev)} ${opSinal}`
  } else if (calcOp && !aguardandoNovoNumero) {
    visorTexto = `${formatarNumVisor(calcPrev)} ${opSinal} ${formatarVisor(calcVal)}`
  }

  // Estrutura do teclado dividida em linhas para o Flexbox do RN
  const teclado = [
    ['C', 'CE', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', ',', 'EMPTY'] // 'EMPTY' serve de placeholder para alinhar a última linha
  ]

  return (
    <View style={styles.container}>
      {/* DISPLAY */}
      <View style={styles.display}>
        <Text style={styles.displayTitle}>Calculadora</Text>
        <Text 
          style={styles.displayText} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {visorTexto || '0'}
        </Text>
      </View>

      {/* KEYPAD */}
      <View style={styles.keypad}>
        {teclado.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn, btnIndex) => {
              if (btn === 'EMPTY') {
                return <View key={btnIndex} style={{ flex: 1 }} />
              }

              const isOperator = ['+', '-', '÷', '×'].includes(btn)
              const isAction = ['C', 'CE'].includes(btn)
              const isEqual = btn === '='
              const isZero = btn === '0'

              return (
                <TouchableOpacity
                  key={btnIndex}
                  activeOpacity={0.7}
                  onPress={() =>
                    calcBtn(
                      btn === '÷' ? '/' : btn === '×' ? '*' : btn
                    )
                  }
                  style={[
                    styles.btn,
                    isZero ? { flex: 2 } : { flex: 1 },
                    isEqual && styles.btnEqual,
                    isOperator && styles.btnOperator,
                    isAction && styles.btnAction,
                    !isEqual && !isOperator && !isAction && styles.btnNum,
                  ]}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isEqual && { color: THEME.equalText },
                      isOperator && { color: THEME.operatorText },
                      isAction && { color: THEME.actionText },
                      !isEqual && !isOperator && !isAction && { color: THEME.numText },
                      btn === 'CE' && { fontSize: 16 }
                    ]}
                  >
                    {btn}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  display: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    backgroundColor: THEME.displayBg,
    borderWidth: 1,
    borderColor: THEME.border,
    minHeight: 90,
    justifyContent: 'center',
  },
  displayTitle: {
    fontSize: 12,
    marginBottom: 4,
    color: 'rgba(255,255,255,.4)',
    textAlign: 'right',
  },
  displayText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 32,
    textAlign: 'right',
  },
  keypad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnEqual: {
    backgroundColor: THEME.equalBg,
    borderColor: 'rgba(139,92,246,.5)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  btnOperator: {
    backgroundColor: THEME.operatorBg,
    borderColor: 'rgba(96,165,250,.2)',
  },
  btnAction: {
    backgroundColor: THEME.actionBg,
    borderColor: 'rgba(255,255,255,.05)',
  },
  btnNum: {
    backgroundColor: THEME.numBg,
    borderColor: 'rgba(255,255,255,.05)',
  },
  btnText: {
    fontSize: 20,
    fontWeight: '600',
  }
})