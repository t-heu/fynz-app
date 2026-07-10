import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from "@/lib/colors"
import { AuthService } from '@/lib/services/auth.service'
import { UsuarioService } from '@/lib/services/usuario.service'
import { useRouter } from 'expo-router'
import { LogOut, Moon, Settings, Sun, Sunrise } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

export function HomeHeader() {
  const { nomeUsuario } = useFinance()
  const router = useRouter()
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light;

  const [avatarUrl, setAvatarUrl] = useState('')
  const [userName, setUserName] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    AuthService.logout()
  };

  useEffect(() => {
    async function loadUserData() {
      const user = await UsuarioService.getDadosUsuario()
      if (user) {
        setAvatarUrl(user.avatarUrl || '')
        setUserName(user.nome || '')
      }
    }
    loadUserData()
  }, [])

  const hora = new Date().getHours()

  const { saudacao, Icone, cor } = useMemo(() => {
    if (hora < 6) return { saudacao: 'Boa madrugada', Icone: Moon, cor: '#6366F1' }
    if (hora < 12) return { saudacao: 'Bom dia', Icone: Sunrise, cor: '#F59E0B' }
    if (hora < 18) return { saudacao: 'Boa tarde', Icone: Sun, cor: '#FB923C' }
    return { saudacao: 'Boa noite', Icone: Moon, cor: '#3B82F6' }
  }, [hora])

  const nomeExibicao = userName || nomeUsuario || 'Usuário'

  return (
    <>
      <View style={styles.container}>
        
        {/* ESQUERDA - Saudação e Nome */}
        <View>
          <View style={styles.saudacaoRow}>
            <Text style={[styles.saudacaoText, { color: currentTheme.mutedForeground }]}>
              {saudacao}
            </Text>
            <Icone size={18} color={cor} />
          </View>

          <Text style={[styles.nameText, { color: currentTheme.foreground }]}>
            {nomeExibicao.split(' ')[0]}
          </Text>
        </View>

        {/* DIREITA - Ações */}
        <View style={styles.actionsRow}>
          
          {/* Avatar / Perfil */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/perfil')}
            style={[styles.avatarBtn, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
          >
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Text style={[styles.avatarFallbackText, { color: currentTheme.foreground }]}>
                {nomeExibicao.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
          
          {/* Configurações */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
            style={[styles.iconBtn, { backgroundColor: currentTheme.card }]}
          >
            <Settings size={18} color={currentTheme.foreground} />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowLogoutModal(true)}
            style={[styles.iconBtn, { backgroundColor: currentTheme.logoutBg }]}
          >
            <LogOut size={18} color={currentTheme.logoutText} />
          </TouchableOpacity>
        </View>

      </View>

      <ConfirmModal 
        visible={showLogoutModal}
        title="Sair da conta"
        message="Você tem certeza que deseja desconectar sua conta?"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 16,
  },
  saudacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saudacaoText: {
    fontSize: 14,
    opacity: 0.7,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})