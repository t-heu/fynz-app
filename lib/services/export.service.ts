import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Alert } from 'react-native'
import { BackupRepository } from '../repositories/backup.repository'
import { UsuarioService } from './usuario.service'

export const ExportService = {
  async exportarDadosCSV() {
    try {
      const userId = await UsuarioService.obterUsuarioId()
      const usuario = await UsuarioService.getDadosUsuario()

      const blob = await BackupRepository.baixarBackup(userId)
      if (!blob) throw new Error("Backup não encontrado.")

      const textoBackup = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(blob)
      })

      const exportacao = {
        exportadoEm: new Date().toISOString(),
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          avatarUrl: usuario.avatarUrl,
        },
        dados: JSON.parse(textoBackup),
      }

      const fileUri = `${FileSystem.documentDirectory}meus-dados.json`
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportacao, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      })

      const isAvailable = await Sharing.isAvailableAsync()
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Exportar Backup',
          mimeType: 'application/json'
        })
      } else {
        Alert.alert('Erro', 'Compartilhamento de arquivos não disponível neste dispositivo.')
      }

    } catch (err) {
      console.error('Erro ao exportar:', err)
      Alert.alert('Erro', 'Ocorreu um problema ao gerar o arquivo de exportação.')
    }
  }
}