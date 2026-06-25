import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from "@/lib/colors"
import { Redirect, Tabs } from 'expo-router'
import {
  ArrowLeftRight,
  BarChart3,
  Goal,
  Home,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'

import { useAuth } from '@/hooks/use-auth'
import { podeEntrar } from '@/services/auth'

export default function TabsLayout() {
  const { user, loading } = useAuth()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light

  const [liberado, setLiberado] = useState<boolean | null>(null)

  useEffect(() => {
    async function verificar() {
      if (!user) return

      const ok = await podeEntrar(user.id)
      setLiberado(ok)
    }

    verificar()
  }, [user])

  if (loading) {
    return null
  }

  if (!user) {
    return <Redirect href="/" />
  }

  if (liberado === null) {
    return null
  }

  if (!liberado) {
    return <Redirect href="/planos" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8a05be',
        tabBarInactiveTintColor: '#a0a0a0',
        tabBarStyle: {
          backgroundColor: currentTheme.tab,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="lancamento"
        options={{
          title: 'Lançamento',
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="relatorios"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="meta"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, size }) => (
            <Goal size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
