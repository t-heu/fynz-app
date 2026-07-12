'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import type { AppData, TabId } from '@/lib/types'

import {
  FinanceService
} from '@/lib/services/finance.service'
import {
  UsuarioService
} from '@/lib/services/usuario.service'

interface FinanceContextType {
  dados: AppData
  setDados: (d: AppData) => void
  salvar: (d: AppData) => void
  nomeUsuario: string
  dataAtualView: Date
  activeTab: TabId
  setActiveTab: (t: TabId) => void
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
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    async function inicializar() {
      try {
        const dadosCarregados = await FinanceService.carregarDados()

        setDadosState(dadosCarregados)

        const data = await UsuarioService.getDadosUsuario()

        // Adicione esta verificação de segurança
        if (data) {
          setNomeUsuario(data.nome);
        } else {
          // Se for null, defina um nome padrão ou trate o erro
          setNomeUsuario('Usuário'); 
        }
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

      await FinanceService.salvarDados(d)
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
        activeTab,
        setActiveTab,
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