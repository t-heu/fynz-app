import { FinanceProvider } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { AuthProvider } from '@/providers/AuthProvider'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { KeyboardProvider } from 'react-native-keyboard-controller'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <KeyboardProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <FinanceProvider>
            <Stack screenOptions={{ headerShown: false }} >
              <Stack.Screen name="(public)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style="dark" backgroundColor="#111" />
          </FinanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </KeyboardProvider>
  )
}
