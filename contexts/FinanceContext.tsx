'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import type { AppData } from '@/lib/types'

import {
  carregarDados,
  getDadosUsuario,
  salvarDados as persistirDados
} from '@/lib/storage'

interface FinanceContextType {
  dados: AppData
  setDados: (d: AppData) => void
  salvar: (d: AppData) => void
  nomeUsuario: string
  dataAtualView: Date
  setDataAtualView: (d: Date) => void
  mudarMes: (direcao: number) => void
}

const FinanceContext =
  createContext<FinanceContextType | null>(null)

export function FinanceProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [dados, setDadosState] = useState<AppData | null>(null)
  const [nomeUsuario, setNomeUsuario] = useState('Usuário')
  const [dataAtualView, setDataAtualView] = useState<Date>(new Date())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    async function inicializar() {
      try {
        const dadosCarregados = await carregarDados()

        setDadosState(dadosCarregados)

        const data = await getDadosUsuario()

        setNomeUsuario(data.nome)
      } catch (err) {
        console.error(
          'Erro ao carregar dados:',
          err
        )
      } finally {
        setHydrated(true)
      }
    }

    inicializar()
  }, [])

  const salvar = useCallback(
    async (d: AppData) => {
      setDadosState({ ...d })

      await persistirDados(d)
    },
    []
  )

  const mudarMes = useCallback(
    (direcao: number) => {
      setDataAtualView(prev => {
        const nova = new Date(prev)

        nova.setMonth(
          nova.getMonth() + direcao
        )

        return nova
      })
    },
    []
  )

  if (!hydrated || !dados) {
    return null
  }

  return (
    <FinanceContext.Provider
      value={{
        dados,
        setDados: setDadosState,
        salvar,
        nomeUsuario,
        dataAtualView,
        setDataAtualView,
        mudarMes,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)

  if (!ctx) {
    throw new Error(
      'useFinance must be used within FinanceProvider'
    )
  }

  return ctx
}