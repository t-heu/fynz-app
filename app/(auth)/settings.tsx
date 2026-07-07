import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    ChevronRight,
    CloudDownload,
    CloudUpload,
    Download,
    FileText,
    HelpCircle,
    LogOut,
    Palette, Shield,
    Star,
    Trash2,
    User,
    UserX
} from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Appearance,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native'

import { ConfirmModal } from "@/components/ui/ConfirmModal"
import {
    changePassword,
    clearData,
    excluirConta,
    exportarDadosCSV,
    fazerBackupNuvem,
    getAssinaturaUsuario,
    getDadosUsuario,
    logout,
    restaurarBackupNuvem
} from '@/lib/storage'

export default function SettingsPage() {
  const router = useRouter()
  
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showResetDataModal, setShowResetDataModal] = useState(false);
  const [showDeleteAccModal, setShowDeleteAccModal] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout()
  };

  const [loading, setLoading] = useState(true)
  const [plano, setPlano] = useState<string | null>(null)
  const [statusPlano, setStatusPlano] = useState<string | null>(null)

  // Estados do Perfil
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Estados do Tema
  const [showThemeOptions, setShowThemeOptions] = useState(false)
  const [themeSetting, setThemeSetting] = useState('system')

  // Estados de Segurança (Senha)
  const [showSecurityForm, setShowSecurityForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)

  // Estados de Backup
  const [showBackupConfirm, setShowBackupConfirm] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [isProcessingBackup, setIsProcessingBackup] = useState(false)
  const [backupStatus, setBackupStatus] = useState<{type: 'error' | 'success' | '', message: string}>({ type: '', message: '' })

  // Definição de cores do tema
  const themeColors = {
    background: isDark ? '#121214' : '#f8f9fa',
    card: isDark ? '#18181b' : '#ffffff',
    border: isDark ? '#27272a' : '#e4e4e7',
    text: isDark ? '#ffffff' : '#121214',
    mutedText: isDark ? '#a1a1aa' : '#71717a',
    primary: '#9333ea',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#eab308'
  }

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getDadosUsuario()
        if (user) {
          setUserName(user.nome || '')
          setAvatarUrl(user.avatarUrl || '')
        }

        const assinatura = await getAssinaturaUsuario()
        setPlano(assinatura.plano)
        setStatusPlano(assinatura.statusPlano)

        const savedTheme = await AsyncStorage.getItem('app-theme')
        if (savedTheme) {
          setThemeSetting(savedTheme)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleThemeChange(selectedTheme: 'light' | 'dark' | 'system') {
    setThemeSetting(selectedTheme)
    await AsyncStorage.setItem('app-theme', selectedTheme)
    
    if (selectedTheme === 'system') {
      Appearance.setColorScheme(null) // Volta para o padrão do sistema
    } else {
      Appearance.setColorScheme(selectedTheme)
    }
  }

  async function handleUpdatePassword() {
    setPasswordError('')
    setPasswordSuccess('')
    setLoadingPassword(true)

    try {
      await changePassword(currentPassword, newPassword, confirmPassword)
      setPasswordSuccess('Senha alterada!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        setShowSecurityForm(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Erro ao atualizar a senha.')
    } finally {
      setLoadingPassword(false)
    }
  }

  async function handleFazerBackup() {
    setBackupStatus({ type: '', message: '' })
    const temDados = true // Simulação: substitua pela sua verificação real

    if (!temDados) {
      setBackupStatus({ type: 'error', message: 'Você não possui dados cadastrados para fazer backup.' })
      return
    }

    setIsProcessingBackup(true)
    try {
      await fazerBackupNuvem()
      setBackupStatus({ type: 'success', message: 'Backup salvo na nuvem com sucesso!' })
      setTimeout(() => {
        setShowBackupConfirm(false)
        setBackupStatus({ type: '', message: '' })
      }, 2500)
    } catch (error) {
      setBackupStatus({ type: 'error', message: 'Falha ao salvar o backup. Tente novamente.' })
    } finally {
      setIsProcessingBackup(false)
    }
  }

  async function handleRestaurarBackup() {
    setBackupStatus({ type: '', message: '' })
    setIsProcessingBackup(true)
    
    try {
      await restaurarBackupNuvem()
      setBackupStatus({ type: 'success', message: 'Dados restaurados com sucesso!' })
      setTimeout(() => {
        setShowRestoreConfirm(false)
        setBackupStatus({ type: '', message: '' })
      }, 2500)
    } catch (error) {
      setBackupStatus({ type: 'error', message: 'Falha ao restaurar o backup.' })
    } finally {
      setIsProcessingBackup(false)
    }
  }

  function toggleBackupPanel(panel: 'backup' | 'restore') {
    setBackupStatus({ type: '', message: '' })
    if (panel === 'backup') {
      setShowBackupConfirm(!showBackupConfirm)
      setShowRestoreConfirm(false)
    } else {
      setShowRestoreConfirm(!showRestoreConfirm)
      setShowBackupConfirm(false)
    }
  }

  // Componentes Auxiliares (Renderizados dentro do arquivo para usar as cores do tema facilmente)
  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: themeColors.mutedText }]}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )

  const Item = ({ title, description, icon, onClick, danger = false }: any) => (
    <TouchableOpacity 
      onPress={onClick} 
      activeOpacity={0.7}
      style={[styles.itemContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
    >
      <View style={styles.itemLeft}>
        <View style={{ marginRight: 12 }}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: danger ? themeColors.danger : themeColors.text }]}>{title}</Text>
          {description && <Text style={[styles.itemDescription, { color: themeColors.mutedText }]}>{description}</Text>}
        </View>
      </View>
      <ChevronRight size={16} color={themeColors.mutedText} />
    </TouchableOpacity>
  )

  const ThemeButton = ({ active, onClick, label }: any) => (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.8}
      style={[
        styles.themeButton,
        { backgroundColor: active ? themeColors.text : 'transparent' }
      ]}
    >
      {active && <Check size={14} color={active ? themeColors.background : themeColors.text} style={{ marginRight: 6 }} />}
      <Text style={[styles.themeButtonText, { color: active ? themeColors.background : themeColors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <View style={[styles.avatar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitials, { color: themeColors.text }]}>
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </Text>
            )}
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Configurações</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.mutedText }]}>
              Olá, {userName ? userName.split(' ')[0] : 'Usuário'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/dashboard')}
          style={[styles.backButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        >
          <ArrowLeft size={20} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <Section title="Conta">
        <Item title="Perfil" description="Nome e foto" icon={<User size={18} color={themeColors.text} />} onClick={() => router.push('/perfil')} />
        <Item title="Segurança" description="Senha e autenticação" icon={<Shield size={18} color={themeColors.text} />} onClick={() => setShowSecurityForm(!showSecurityForm)} />

        {showSecurityForm && (
          <View style={[styles.subPanel, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <TextInput style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]} placeholderTextColor={themeColors.mutedText} placeholder="Senha atual" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
            <TextInput style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]} placeholderTextColor={themeColors.mutedText} placeholder="Nova senha" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TextInput style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]} placeholderTextColor={themeColors.mutedText} placeholder="Confirme a nova senha" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            {passwordSuccess ? <Text style={styles.successText}>{passwordSuccess}</Text> : null}

            <TouchableOpacity disabled={loadingPassword} onPress={handleUpdatePassword} style={[styles.primaryButton, { backgroundColor: themeColors.text }]}>
              <Text style={[styles.primaryButtonText, { color: themeColors.background }]}>
                {loadingPassword ? 'Aguarde...' : 'Salvar Senha'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Section>

      <Section title="Assinaturas">
        {loading ? (
          <View style={[styles.planCardPlaceholder, { backgroundColor: themeColors.card }]}>
            <ActivityIndicator color={themeColors.primary} />
          </View>
        ) : (
          <View style={styles.planCard}>
            <View>
              <Text style={styles.planLabel}>Seu plano atual</Text>
              <Text style={styles.planTitle}>{plano}</Text>
              <Text style={styles.planSubtitle}>{statusPlano}</Text>
            </View>
            <Star size={28} color="#ffffff" />
          </View>
        )}
        <Item title="Ver Planos de Assinatura" description="Mensal, Semestral e Anual" icon={<Star size={18} color={themeColors.text} />} onClick={() => router.push('/planos')} />
      </Section>

      <Section title="Aparência">
        <Item title="Tema" description={themeSetting === 'dark' ? 'Escuro' : themeSetting === 'light' ? 'Claro' : 'Automático do Sistema'} icon={<Palette size={18} color={themeColors.text} />} onClick={() => setShowThemeOptions(!showThemeOptions)} />
        {showThemeOptions && (
          <View style={[styles.themeOptionsRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <ThemeButton active={themeSetting === 'light'} onClick={() => handleThemeChange('light')} label="Claro" />
            <ThemeButton active={themeSetting === 'dark'} onClick={() => handleThemeChange('dark')} label="Escuro" />
            <ThemeButton active={themeSetting === 'system'} onClick={() => handleThemeChange('system')} label="Auto" />
          </View>
        )}
      </Section>

      <Section title="Backup em Nuvem">
        <Item title="Fazer Backup" description="Salvar dados na nuvem" icon={<CloudUpload size={18} color={themeColors.text} />} onClick={() => toggleBackupPanel('backup')} />
        
        {showBackupConfirm && (
          <View style={[styles.subPanel, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.alertRow}>
              <AlertTriangle size={20} color={themeColors.warning} style={{ marginTop: 2 }} />
              <Text style={[styles.alertText, { color: themeColors.text }]}>Tem certeza que deseja enviar seus dados atuais para a nuvem? Isso irá sobrescrever o backup anterior.</Text>
            </View>
            
            {backupStatus.message ? <Text style={[styles.statusMessage, { color: backupStatus.type === 'error' ? themeColors.danger : themeColors.success }]}>{backupStatus.message}</Text> : null}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity onPress={() => setShowBackupConfirm(false)} disabled={isProcessingBackup} style={[styles.secondaryActionBtn, { borderColor: themeColors.border }]}>
                <Text style={[styles.secondaryActionText, { color: themeColors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFazerBackup} disabled={isProcessingBackup} style={[styles.primaryActionBtn, { backgroundColor: themeColors.text }]}>
                <Text style={[styles.primaryActionText, { color: themeColors.background }]}>{isProcessingBackup ? 'Enviando...' : 'Confirmar Backup'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Item title="Restaurar Backup" description="Recuperar último backup" icon={<CloudDownload size={18} color={themeColors.text} />} onClick={() => toggleBackupPanel('restore')} />

        {showRestoreConfirm && (
          <View style={[styles.subPanel, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.alertRow}>
              <AlertTriangle size={20} color={themeColors.danger} style={{ marginTop: 2 }} />
              <Text style={[styles.alertText, { color: themeColors.text }]}>Tem certeza? A restauração irá apagar os dados locais atuais e substituí-los pela versão da nuvem.</Text>
            </View>

            {backupStatus.message ? <Text style={[styles.statusMessage, { color: backupStatus.type === 'error' ? themeColors.danger : themeColors.success }]}>{backupStatus.message}</Text> : null}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity onPress={() => setShowRestoreConfirm(false)} disabled={isProcessingBackup} style={[styles.secondaryActionBtn, { borderColor: themeColors.border }]}>
                <Text style={[styles.secondaryActionText, { color: themeColors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRestaurarBackup} disabled={isProcessingBackup} style={[styles.primaryActionBtn, { backgroundColor: themeColors.danger }]}>
                <Text style={[styles.primaryActionText, { color: '#ffffff' }]}>{isProcessingBackup ? 'Restaurando...' : 'Sim, Restaurar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Section>

      <Section title="Privacidade e Dados">
        <Item title="Exportar meus dados" description="Baixar uma cópia em CSV" icon={<Download size={18} color={themeColors.text} />} onClick={exportarDadosCSV} />
        <Item title="Excluir minha conta" description="Remove permanentemente sua conta" danger icon={<UserX size={18} color={themeColors.danger} />} onClick={() => setShowDeleteAccModal(true)} />
      </Section>

      <Section title="Suporte e Legal">
        <Item title="Perguntas Frequentes (FAQ)" description="Tire suas dúvidas sobre o app" icon={<HelpCircle size={18} color={themeColors.text} />} onClick={() => router.push('/')} />
        <Item title="Termos e Privacidade" description="Nossas regras e compromissos" icon={<FileText size={18} color={themeColors.text} />} onClick={() => router.push('/')} />
      </Section>

      <Section title="Zona de perigo">
        <Item title="Resetar dados" description="Apaga tudo permanentemente" danger icon={<Trash2 size={18} color={themeColors.danger} />} onClick={() => setShowResetDataModal(true)} />
        <Item title={loading ? 'Saindo...' : 'Sair da conta'} description="Desconectar do sistema" danger icon={<LogOut size={18} color={themeColors.danger} />} onClick={() => setShowLogoutModal(true)} />
      </Section>

      <ConfirmModal 
        visible={showLogoutModal}
        title="Sair da conta"
        message="Você tem certeza que deseja desconectar sua conta?"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      <ConfirmModal 
        visible={showResetDataModal}
        title="Atenção!"
        message="Esta ação apagará todos os seus registros."
        onCancel={() => setShowResetDataModal(false)}
        onConfirm={clearData}
      />

      <ConfirmModal 
        visible={showDeleteAccModal}
        title="Excluir Conta"
        message="Seu acesso será revogado e seus dados apagados. Se tem certeza?"
        onCancel={() => setShowDeleteAccModal(false)}
        onConfirm={excluirConta}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, marginTop: 16 },
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarInitials: { fontSize: 18, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14 },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginLeft: 4 },
  sectionContent: { gap: 8 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '500' },
  itemDescription: { fontSize: 12, marginTop: 2 },
  subPanel: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 12, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  primaryButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 14, fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 12 },
  successText: { color: '#22c55e', fontSize: 12 },
  planCardPlaceholder: { height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  planCard: { backgroundColor: '#9333ea', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  planLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  planTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  planSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  themeOptionsRow: { flexDirection: 'row', gap: 8, padding: 8, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  themeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  themeButtonText: { fontSize: 13, fontWeight: '600' },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  alertText: { fontSize: 13, flex: 1, lineHeight: 18 },
  statusMessage: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  actionButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  secondaryActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  secondaryActionText: { fontSize: 13, fontWeight: '500' },
  primaryActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  primaryActionText: { fontSize: 13, fontWeight: '600' }
})