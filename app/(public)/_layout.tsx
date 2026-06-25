import { useAuth } from '@/hooks/use-auth'
import { Redirect, Slot } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PublicLayout() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    return <Redirect href="/(tabs)/dashboard" />
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Slot />
    </SafeAreaView>
  )
}