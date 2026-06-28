import { ConfirmModal } from "@/components/ConfirmModal";
import { getAssinaturaUsuario, getDadosUsuario, logout } from '@/lib/storage'; // Dica: Ideal migrar p/ SecureStore ou AsyncStorage no mobile
import type { Assinatura } from '@/lib/types';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  HeartCrack,
  LogOut,
  Shield,
  Star,
  Zap
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

interface DadosUsuario {
  assinatura?: Assinatura | null
  plano: string
  statusPlano: string
  possuiAcesso: boolean
  trialExpirou: boolean
}

export default function PlanosPage() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [loading, setLoading] = useState(true)
  const [loadingCheck, setLoadingCheck] = useState<string | null>(null)
  const [plano, setPlano] = useState<DadosUsuario | null>(null)
  const [statusPlano, setStatusPlano] = useState<boolean>(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout()
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAssinaturaUsuario()

        if (!data) {
          setPlano(null)
          setStatusPlano(false)
          return
        }

        setPlano(data)
        setStatusPlano(data.possuiAcesso)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function iniciarAssinatura(priceId: string) {
    try {
      setLoadingCheck(priceId)
      
      const user = await getDadosUsuario()
      
      if (!user) {
        Alert.alert('Atenção', 'Você precisa estar logado para assinar.')
        return
      }

      // IMPORTANTE: Trocar para a URL cheia do seu backend se não estiver rodando rotas de API no próprio Expo Router
      const response = await fetch('https://seu-dominio.com/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: user.id,
          userEmail: user.email
        })
      })

      const dados = await response.json()

      if (dados.url) {
        // Abre o link do Stripe no navegador do celular
        await Linking.openURL(dados.url)
      } else {
        Alert.alert('Erro', 'Erro ao gerar pagamento: ' + dados.error)
      }
    } catch (error) {
      console.error('Erro:', error)
      Alert.alert('Erro', 'Erro ao conectar com o provedor de pagamento.')
    } finally {
      setLoadingCheck(null)
    }
  }

  async function abrirPortal() {
    try {
      const user = await getDadosUsuario()
      if (!user) return

      const response = await fetch('https://seu-dominio.com/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const data = await response.json()
      
      if (data.url) {
        await Linking.openURL(data.url)
      } else {
        Alert.alert('Erro', 'Algo deu errado!')
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao conectar ao portal.')
    }
  }

  // Definição de cores base do tema para substituir o CSS customizado
  const theme = {
    background: isDark ? '#121214' : '#f8f9fa',
    text: isDark ? '#ffffff' : '#121214',
    mutedText: isDark ? '#a1a1aa' : '#71717a',
    border: isDark ? '#27272a' : '#e4e4e7',
    card: isDark ? '#18181b' : '#ffffff',
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={[styles.loadingText, { color: theme.text }]}>Carregando assinatura...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scrollContainer}>
      
      {/* Cabeçalho */}
      <View style={[styles.header, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Planos</Text>
        </View>

        <TouchableOpacity 
          onPress={() => setShowLogoutModal(true)} 
          style={styles.logoutButton}
        >
          <LogOut size={14} color="#f87171" />
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      {statusPlano ? (
        <View style={styles.content}>
          <View style={styles.centerTextContainer}>
            <View style={styles.badgeSuccess}>
              <CheckCircle2 size={14} color="#4ade80" />
              <Text style={styles.badgeSuccessText}>
                {plano?.assinatura?.status === 'trialing' ? 'Teste Grátis Ativo' : 'Assinatura Ativa'}
              </Text>
            </View>

            <Text style={[styles.mainTitle, { color: theme.text }]}>Plano Premium</Text>
            <Text style={[styles.subtitle, { color: theme.mutedText }]}>
              Gerencie sua assinatura e forma de pagamento.
            </Text>
          </View>

          {/* Card Premium Ativo */}
          <View style={[
            styles.cardPremium, 
            { 
              backgroundColor: isDark ? '#1e1b4b' : '#ffffff',
              borderColor: isDark ? 'rgba(138,5,190,.35)' : 'rgba(15, 23, 42, .08)'
            }
          ]}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{plano?.plano}</Text>
                <Text style={styles.cardSubtitle}>
                  {plano?.assinatura?.status === 'trialing' ? 'Teste Grátis' : 'Ativo'}
                </Text>
              </View>
              <Star size={24} color="#c084fc" />
            </View>

            <View style={styles.infoSection}>
              {plano?.assinatura?.status === 'trialing' ? (
                <View>
                  <Text style={styles.infoLabel}>Término do teste</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {plano.assinatura.trial_fim ? new Date(plano.assinatura.trial_fim).toLocaleDateString('pt-BR') : '-'}
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.infoLabel}>
                    {plano?.assinatura?.cancel_at ? 'Acesso até' : 'Próxima cobrança'}
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {plano?.assinatura?.plano_ativo === 'vitalicio' ? 'Permanente' : plano?.assinatura?.periodo_fim ? new Date(plano.assinatura.periodo_fim).toLocaleDateString('pt-BR') : '-'}
                  </Text>
                </View>
              )}
              {plano?.assinatura?.cancel_at && (
                <Text style={styles.cancelWarning}>
                  Sua assinatura foi cancelada. Você continuará com acesso Premium até essa data.
                </Text>
              )}
            </View>

            {plano?.assinatura?.plano_ativo === 'premium' ? (
              <TouchableOpacity onPress={abrirPortal} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Gerenciar Assinatura</Text>
              </TouchableOpacity>
            ) : plano?.assinatura?.plano_ativo === 'vitalicio' ? (
              <Text style={styles.statusTextGreen}>Plano vitalício ativo</Text>
            ) : (
              <Text style={styles.statusTextYellow}>Seu teste grátis acaba em 7 dias</Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.centerTextContainer}>
            <View style={styles.badgeTrialEnded}>
              <HeartCrack size={14} color="#c084fc" />
              <Text style={styles.badgeTrialEndedText}>Acabou 7 Dias Grátis</Text>
            </View>
            <Text style={[styles.mainTitle, { color: theme.text }]}>Eleve seu controle</Text>
            <Text style={[styles.subtitle, { color: theme.mutedText }]}>
              Experimente o Fynz Pro sem compromisso. Cancele a qualquer momento.
            </Text>
          </View>

          <View style={styles.plansGap}>
            
            {/* PLANO MENSAL */}
            <View style={[styles.planCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.planTitle, { color: theme.text }]}>
                  <Shield size={20} color="#94a3b8" /> Mensal
                </Text>
              </View>
              <Text style={styles.planDescription}>Acesso completo com cobrança mensal.</Text>
              <Text style={[styles.planPrice, { color: theme.text }]}>R$ 5,99<Text style={styles.planPeriod}> /mês</Text></Text>
              
              <View style={styles.featuresList}>
                <Text style={[styles.featureItem, { color: theme.mutedText }]}>✓ Acesso a todas as ferramentas</Text>
                <Text style={[styles.featureItem, { color: theme.mutedText }]}>✓ Relatórios e categorias liberadas</Text>
              </View>

              <TouchableOpacity 
                onPress={() => iniciarAssinatura(process.env.EXPO_PUBLIC_STRIPE_PLAN_MENSAL as string)}
                disabled={loadingCheck !== null}
                style={[styles.buttonSecondary, { backgroundColor: isDark ? '#27272a' : '#e4e4e7' }]}
              >
                <Text style={[styles.buttonSecondaryText, { color: theme.text }]}>
                  {loadingCheck === process.env.EXPO_PUBLIC_STRIPE_PLAN_MENSAL ? 'Processando...' : 'Assinar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* PLANO SEMESTRAL */}
            <View style={[styles.planCard, { backgroundColor: '#1e1b4b', borderColor: '#9333ea', borderWidth: 1.5 }]}>
              <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>Mais Popular</Text></View>
              <Text style={styles.planTitleLight}><Star size={20} color="#c084fc" /> Semestral</Text>
              <Text style={styles.planDescriptionLight}>Economize com o plano semestral.</Text>
              <Text style={styles.planPriceLight}>R$ 4,98<Text style={styles.planPeriodLight}> /mês</Text></Text>
              <Text style={styles.billingDetailLight}>Cobrado R$ 29,90 a cada 6 meses</Text>

              <View style={styles.featuresList}>
                <Text style={styles.featureItemLight}>✓ Tudo do plano mensal</Text>
                <Text style={styles.featureItemLight}>✓ Economia de 17% ao ano</Text>
              </View>

              <TouchableOpacity 
                onPress={() => iniciarAssinatura(process.env.EXPO_PUBLIC_STRIPE_PLAN_SEMESTRAL as string)}
                disabled={loadingCheck !== null}
                style={styles.buttonPurple}
              >
                <Text style={styles.buttonPurpleText}>
                  {loadingCheck === process.env.EXPO_PUBLIC_STRIPE_PLAN_SEMESTRAL ? 'Processando...' : 'Assinar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* PLANO ANUAL */}
            <View style={[styles.planCard, { backgroundColor: '#064e3b', borderColor: '#10b981', borderWidth: 1.5 }]}>
              <View style={[styles.popularBadge, { backgroundColor: '#10b981' }]}><Text style={styles.popularBadgeText}>Melhor Valor</Text></View>
              <Text style={styles.planTitleLight}><Zap size={20} color="#34d399" /> Anual</Text>
              <Text style={styles.planDescriptionLight}>Economize ainda mais com o plano anual.</Text>
              <Text style={styles.planPriceLight}>R$ 4,15<Text style={styles.planPeriodLight}> /mês</Text></Text>
              <Text style={styles.billingDetailLight}>Cobrado R$ 49,90 por ano</Text>

              <View style={styles.featuresList}>
                <Text style={styles.featureItemLight}>✓ Tudo do plano semestral</Text>
                <Text style={styles.featureItemLight}>✓ Economia de 30% ao ano</Text>
              </View>

              <TouchableOpacity 
                onPress={() => iniciarAssinatura(process.env.EXPO_PUBLIC_STRIPE_PLAN_ANUAL as string)}
                disabled={loadingCheck !== null}
                style={styles.buttonGreen}
              >
                <Text style={styles.buttonGreenText}>
                  {loadingCheck === process.env.EXPO_PUBLIC_STRIPE_PLAN_ANUAL ? 'Processando...' : 'Assinar'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      )}

      <ConfirmModal 
        visible={showLogoutModal}
        title="Sair da conta"
        message="Você tem certeza que deseja desconectar sua conta?"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12, 
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  logoutButtonText: { color: '#f87171', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  content: { paddingHorizontal: 20, paddingTop: 24, maxWidth: 450, width: '100%', alignSelf: 'center' },
  centerTextContainer: { alignItems: 'center', marginBottom: 32 },
  badgeSuccess: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: 'rgba(74, 222, 128, 0.1)', 
    borderWidth: 1, 
    borderColor: 'rgba(74, 222, 128, 0.2)',
    marginBottom: 16
  },
  badgeSuccessText: { color: '#4ade80', fontSize: 12, fontWeight: 'bold', marginLeft: 8, textTransform: 'uppercase' },
  badgeTrialEnded: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: 'rgba(147, 51, 234, 0.1)', 
    borderWidth: 1, 
    borderColor: 'rgba(147, 51, 234, 0.2)',
    marginBottom: 16
  },
  badgeTrialEndedText: { color: '#c084fc', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  mainTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  cardPremium: { borderRadius: 24, padding: 24, borderWidth: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardTitle: { fontSize: 20, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#e9d5ff', marginTop: 4 },
  infoSection: { marginBottom: 24 },
  infoLabel: { fontSize: 12, color: '#d8b4fe', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600' },
  cancelWarning: { color: '#facc15', fontSize: 12, marginTop: 8 },
  primaryButton: { backgroundColor: '#9333ea', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  statusTextGreen: { color: '#16a34a', textAlign: 'center', fontWeight: '500', fontSize: 14 },
  statusTextYellow: { color: '#ca8a04', textAlign: 'center', fontWeight: '500', fontSize: 14 },
  plansGap: { gap: 20 },
  planCard: { borderRadius: 24, padding: 24, borderWidth: 1, position: 'relative' },
  planTitle: { fontSize: 20, fontWeight: 'bold', flexDirection: 'row', alignItems: 'center', gap: 8 },
  planTitleLight: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', gap: 8 },
  planDescription: { fontSize: 12, color: '#94a3b8', marginTop: 4, marginBottom: 16 },
  planDescriptionLight: { fontSize: 12, color: '#e9d5ff', marginTop: 4, marginBottom: 16 },
  planPrice: { fontSize: 32, fontWeight: '800' },
  planPriceLight: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  planPeriod: { fontSize: 14, color: '#71717a', fontWeight: 'normal' },
  planPeriodLight: { fontSize: 14, color: '#d8b4fe', fontWeight: 'normal' },
  billingDetailLight: { fontSize: 11, color: '#c084fc', marginTop: 4 },
  featuresList: { marginTop: 16, marginBottom: 24, gap: 10 },
  featureItem: { fontSize: 14 },
  featureItemLight: { fontSize: 14, color: '#f3e8ff' },
  popularBadge: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    backgroundColor: '#9333ea', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderBottomLeftRadius: 12 
  },
  popularBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  buttonSecondary: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonSecondaryText: { fontWeight: 'bold', fontSize: 16 },
  buttonPurple: { backgroundColor: '#9333ea', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonPurpleText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  buttonGreen: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonGreenText: { color: '#000000', fontWeight: 'bold', fontSize: 16 }
})