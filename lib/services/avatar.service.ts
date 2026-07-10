import { supabase } from '@/lib/supabase'
import { traduzirErroAuth } from '@/lib/traduzir-erro-auth'
import { Platform } from 'react-native'
import { UsuarioCache } from '../cache/usuario-cache'
import { StorageRepository } from '../repositories/storage.repository'
import { UsuarioRepository } from '../repositories/usuario.repository'

export const AvatarService = {
  async uploadProfilePhoto(image: { uri: string, name: string, type: string }, userId: string) {
    try {
      const fileExt = image.name.split('.').pop()
      
      // 1. Nome padrão baseado no usuário, sem UUID aleatório
      const fileName = `${userId}-avatar.${fileExt}`

      const { data: { user } } = await supabase.auth.getUser()
      const oldAvatarPath = user?.user_metadata?.avatar_path

      // 2. Só tenta apagar o arquivo antigo se a extensão/nome mudou 
      // (ex: trocou de .png para .jpg). Se for igual, o upload abaixo já vai sobrescrever.
      if (oldAvatarPath && oldAvatarPath !== fileName) {
        await StorageRepository.remover('avatars', [oldAvatarPath])
      }

      const formData = new FormData()
      formData.append('file', {
        uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
        name: fileName,
        type: image.type,
      } as any)

      // Faz o upload. O { upsert: true } no repositório cuida de substituir o arquivo
      await StorageRepository.upload('avatars', fileName, formData)
      
      let avatarUrl = StorageRepository.getPublicUrl('avatars', fileName)

      // 3. Cache Buster: Garante que o React Native baixe e mostre a imagem atualizada na tela
      avatarUrl = `${avatarUrl}?t=${Date.now()}`

      await UsuarioRepository.atualizarMetadados({ avatar_url: avatarUrl, avatar_path: fileName })
      UsuarioCache.clear() 

      return avatarUrl
    } catch (error: any) {
      throw new Error(traduzirErroAuth(error))
    }
  },

  async removeProfilePhoto() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const avatarPath = user?.user_metadata?.avatar_path

      if (avatarPath) {
        await StorageRepository.remover('avatars', [avatarPath])
      }

      await UsuarioRepository.atualizarMetadados({ avatar_url: null, avatar_path: null })
      UsuarioCache.clear()
    } catch (error: any) {
      throw new Error(traduzirErroAuth(error))
    }
  }
}