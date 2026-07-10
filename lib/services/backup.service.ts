import { Alert } from 'react-native';
import { BackupRepository } from '../repositories/backup.repository';
import { FinanceService } from '../services/finance.service'; // Supondo que você moveu os métodos locais para cá
import { UsuarioService } from '../services/usuario.service';
import { AssinaturaService } from './assinatura.service';

export const BackupService = {
  async validarLimiteBackup(userId: string): Promise<void> {
    const info = await AssinaturaService.getAssinaturaUsuario()
    const assinatura = info.assinatura

    if (assinatura?.plano_ativo === 'vitalicio') return

    let limiteHoras = 24
    const semestral = process.env.NEXT_PUBLIC_STRIPE_PLAN_SEMESTRAL
    const anual = process.env.NEXT_PUBLIC_STRIPE_PLAN_ANUAL

    if (assinatura?.status === 'active' || assinatura?.status === 'trialing') {
      if (assinatura.stripe_price_id === semestral) limiteHoras = 12
      else if (assinatura.stripe_price_id === anual) limiteHoras = 6
    }

    const ultimoBackup = await BackupRepository.buscarUltimoBackup(userId)
    if (!ultimoBackup) return

    const diffMs = Date.now() - new Date(ultimoBackup).getTime()
    const limiteMs = limiteHoras * 60 * 60 * 1000

    if (diffMs < limiteMs) {
      const horasRestantes = Math.ceil((limiteMs - diffMs) / (60 * 60 * 1000))
      throw new Error(`Seu plano permite 1 backup a cada ${limiteHoras}h. Aguarde ${horasRestantes} hora(s).`)
    }
  },

  async fazerBackupNuvem(): Promise<void> {
    try {
      const userId = await UsuarioService.obterUsuarioId()
      await this.validarLimiteBackup(userId)

      const dados = await FinanceService.carregarDados()
      await BackupRepository.uploadBackup(userId, JSON.stringify(dados))
      await BackupRepository.registrarDataBackup(userId)

      Alert.alert('Sucesso', 'Backup em nuvem realizado com sucesso!')
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer backup')
      throw error
    }
  },

  async restaurarBackupNuvem() {
    try {
      const userId = await UsuarioService.obterUsuarioId()
      if (!userId) return null

      const blob = await BackupRepository.baixarBackup(userId)
      if (!blob) return null

      const texto = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(blob)
      })

      if (!texto || !texto.trim()) return null

      const dadosRestaurados = JSON.parse(texto)
      await FinanceService.salvarDados(dadosRestaurados)
      
      return dadosRestaurados
    } catch (err) {
      console.error("Erro crítico no backup:", err)
      return null
    }
  }
}