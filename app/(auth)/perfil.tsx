import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { ArrowLeft, Camera } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native'

import {
    getDadosUsuario,
    removeProfilePhoto,
    updateProfileName,
    uploadProfilePhoto,
} from '@/lib/storage'

export default function PerfilPage() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [userId, setUserId] = useState('')

  // Definição de cores do tema
  const theme = {
    background: isDark ? '#121214' : '#f8f9fa',
    card: isDark ? '#18181b' : '#ffffff',
    border: isDark ? '#27272a' : '#e4e4e7',
    text: isDark ? '#ffffff' : '#121214',
    mutedText: isDark ? '#a1a1aa' : '#71717a',
    danger: '#ef4444',
  }

  // Busca os dados atuais do usuário ao carregar a página
  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await getDadosUsuario()
        if (user) {
          setUserId(user.id)
          setFullName(user.nome || '')
          setAvatarUrl(user.avatarUrl || '')
          setEmail(user.email)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setFetching(false)
      }
    }

    loadProfile()
  }, [])

  // Gerencia a seleção e upload da imagem da galeria nativa
  async function handlePickImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para alterar o avatar.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (result.canceled) return

      setLoading(true)
      const pickedAsset = result.assets[0]

      // Adaptação do arquivo para a estrutura aceita pelo seu backend/upload
      const fileMock = {
        uri: pickedAsset.uri,
        name: pickedAsset.fileName || 'profile.jpg',
        type: pickedAsset.mimeType || 'image/jpeg'
      }

      const newAvatarUrl = await uploadProfilePhoto(fileMock, userId)
      setAvatarUrl(newAvatarUrl || pickedAsset.uri)

      Alert.alert('Sucesso', 'Foto atualizada com sucesso!')
    } catch (error) {
      console.error(error)
      Alert.alert('Erro', 'Erro ao atualizar a foto.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemovePhoto() {
    try {
      setLoading(true)
      await removeProfilePhoto()
      setAvatarUrl('')
      Alert.alert('Sucesso', 'Foto removida com sucesso!')
    } catch (error) {
      console.error(error)
      Alert.alert('Erro', 'Erro ao remover a foto.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveName() {
    try {
      setLoading(true)
      await updateProfileName(fullName)
      Alert.alert('Sucesso', 'Nome atualizado com sucesso!')
    } catch {
      Alert.alert('Erro', 'Erro ao atualizar o nome.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.mutedText} />
        <Text style={[styles.loadingText, { color: theme.mutedText }]}>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Perfil</Text>
          <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>Gerencie sua conta e preferências</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/settings')}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <ArrowLeft size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* FOTO DE PERFIL CENTRALIZADA */}
      <View style={styles.avatarSection}>
        <TouchableOpacity 
          onPress={handlePickImage} 
          disabled={loading}
          activeOpacity={0.8}
          style={[styles.avatarWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.mutedText} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitials, { color: theme.text }]}>
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </Text>
          )}

          {/* Badge de câmera flutuante (Estilo Mobile) */}
          <View style={[styles.cameraBadge, { backgroundColor: theme.text }]}>
            <Camera size={14} color={theme.background} />
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.avatarHint, { color: theme.mutedText }]}>Toque na imagem para alterar</Text>

        {avatarUrl && (
          <TouchableOpacity onPress={handleRemovePhoto} disabled={loading} style={styles.removePhotoBtn}>
            <Text style={[styles.removePhotoText, { color: theme.danger }]}>Remover foto</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FORMULÁRIO DE DADOS */}
      <View style={[styles.formContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Nome completo</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholderTextColor={theme.mutedText}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Seu nome"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.mutedText }]}>E-mail institucional</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled, { borderColor: theme.border, color: theme.mutedText }]}
            value={email}
            editable={false}
            selectTextOnFocus={false}
            placeholder="Seu e-mail"
          />
        </View>
        
        <TouchableOpacity
          onPress={handleSaveName}
          disabled={loading || !fullName}
          activeOpacity={0.9}
          style={[styles.saveButton, { backgroundColor: theme.text, opacity: (loading || !fullName) ? 0.5 : 1 }]}
        >
          <Text style={[styles.saveButtonText, { color: theme.background }]}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
  loadingText: { fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, marginTop: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarWrapper: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 54, resizeMode: 'cover' },
  avatarInitials: { fontSize: 36, fontWeight: 'bold', opacity: 0.6 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarHint: { fontSize: 12, marginTop: 12, opacity: 0.7 },
  removePhotoBtn: { marginTop: 8, padding: 4 },
  removePhotoText: { fontSize: 14, fontWeight: '500' },
  formContainer: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 20 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  inputDisabled: { backgroundColor: 'rgba(0,0,0,0.02)' },
  saveButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  saveButtonText: { fontSize: 15, fontWeight: '600' }
})