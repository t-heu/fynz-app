import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'orgFinancasV8'

export async function getItem<T>(key: string = STORAGE_KEY): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error('Erro ao buscar dados do AsyncStorage:', error)
    return null
  }
}

export async function setItem<T>(value: T, key: string = STORAGE_KEY): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Erro ao salvar dados no AsyncStorage:', error)
  }
}

export async function clearStorage(key: string = STORAGE_KEY): Promise<void> {
  try {
    await AsyncStorage.removeItem(key)
  } catch (error) {
    console.error('Erro ao limpar AsyncStorage:', error)
  }
}