import { PALETA } from '@/lib/colors'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { clearStorage, getItem, setItem } from '../storage/db'
import type { AppData, Categoria } from '../types'

const CURRENT_VERSION = 1

export const FinanceService = {
  getDadosIniciais(): AppData {
    return {
      version: CURRENT_VERSION,
      lastModified: new Date().toISOString(),
      contas: [],
      cartoes: [],
      categorias: [
        { id: 'META', nome: 'Meta', tipo: 'Despesa', icone: 'goal', cor: '#c27aff' },
        { id: 'FATURA', nome: 'Pagamento da Fatura', tipo: 'Despesa', icone: 'creditcard', cor: '#22C55E' },
        { id: 'SALARIO', nome: 'Salário', tipo: 'Receita', icone: 'money', cor: PALETA[9] }
      ],
      lancamentos: [],
      metas: []
    }
  },

  migrarDados(dados: any): AppData {
    if (!dados.version) dados.version = CURRENT_VERSION
    if (!dados.lastModified) dados.lastModified = new Date().toISOString()
    if (!dados.cartoes) dados.cartoes = []
    if (!dados.metas) dados.metas = []
    if (!dados.categorias) dados.categorias = []
    return dados as AppData
  },

  async carregarDados(): Promise<AppData> {
    try {
      let dados = await getItem<AppData>()

      if (!dados) {
        return this.getDadosIniciais()
      }

      dados = this.migrarDados(dados)

      if (!dados.categorias.find((c: Categoria) => c.id === 'META')) {
        dados.categorias.push({ id: 'META', nome: 'Meta', tipo: 'Despesa', icone: 'goal', cor: '#fff' })
      }

      if (!dados.categorias.find((c: Categoria) => c.id === 'FATURA')) {
        dados.categorias.push({ id: 'FATURA', nome: 'Pagamento da Fatura', tipo: 'Despesa', icone: 'wallet', cor: '#000' })
      }

      return dados
    } catch {
      return this.getDadosIniciais()
    }
  },

  async salvarDados(dados: AppData): Promise<void> {
    dados.lastModified = new Date().toISOString()
    await setItem(dados)
  },

  async clearData() {
    Alert.alert(
      'Apagar Tudo',
      'Todos os dados registrados serão excluídos permanentemente do aplicativo e não poderão ser recuperados. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, excluir', 
          style: 'destructive',
          onPress: async () => {
            await clearStorage()
            router.push('/(tabs)/dashboard') 
          }
        }
      ]
    )
  }
}