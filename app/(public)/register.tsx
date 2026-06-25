import { getPasswordStrength } from '@/lib/finance-utils';
import { register } from '@/lib/storage';
import { router } from 'expo-router';
import { Eye, Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const PROVEDORES_BASE = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 
  'icloud.com', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'live.com'
];

const COLORS = {
  background: '#121214',
  foreground: '#E1E1E6',
  mutedForeground: '#8D8D99',
  card: '#202024',
  cardHover: '#29292E',
  cardElevated: '#29292E',
  primary: '#8a05be',
  success: '#22c55e',
  destructive: '#dc2626',
  border: '#323238',
  white: '#FFFFFF',
  inputBg: '#121214'
};

// ... (Mantenha sua função calcularSimilaridade aqui)
function calcularSimilaridade(digitado: string, alvo: string): number {
  if (digitado === alvo) return 1
  const a = digitado.toLowerCase()
  const b = alvo.toLowerCase()
  const matriz = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) matriz[i][0] = i
  for (let j = 0; j <= b.length; j++) matriz[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      matriz[i][j] = Math.min(matriz[i - 1][j] + 1, matriz[i][j - 1] + 1, matriz[i - 1][j - 1] + custo)
    }
  }
  const tamanhoMaximo = Math.max(a.length, b.length)
  const distancia = matriz[a.length][b.length]
  return (tamanhoMaximo - distancia) / tamanhoMaximo
}

export default function CadastroPage({ navigation }: { navigation?: any }) {
  // ... (seus estados permanecem iguais)
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [sugestaoEmail, setSugestaoEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [cadastroConcluido, setCadastroConcluido] = useState(false)

  const passwordStrength = getPasswordStrength(senha)
  const strengthLabel = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte', 'Muito forte'][passwordStrength]
  const strengthColor = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e', '#16a34a'][passwordStrength]

  function verificarSugestaoEmail(emailDigitado: string) {
    const partes = emailDigitado.split('@')
    if (partes.length !== 2 || partes[1].length < 2) { setSugestaoEmail(''); return; }
    const usuario = partes[0]
    const dominioDigitado = partes[1].toLowerCase().trim()
    if (PROVEDORES_BASE.includes(dominioDigitado)) { setSugestaoEmail(''); return; }
    let melhorMatch = ''
    let maiorSimilaridade = 0
    for (const provedor of PROVEDORES_BASE) {
      const similaridade = calcularSimilaridade(dominioDigitado, provedor)
      if (similaridade > maiorSimilaridade) { maiorSimilaridade = similaridade; melhorMatch = provedor; }
    }
    setSugestaoEmail((maiorSimilaridade >= 0.5 && maiorSimilaridade < 1) ? `${usuario}@${melhorMatch}` : '')
  }

  async function handleCadastrar() {
    if (passwordStrength < 4) { setErro('Senha fraca.'); return; }
    if (!aceitouTermos) { setErro('Aceite os termos.'); return; }
    try {
      setLoading(true); setErro('');
      await register({ email, senha, nome });
      setCadastroConcluido(true);
    } catch (err: any) { setErro(err.message || 'Erro.'); } finally { setLoading(false); }
  }

  if (cadastroConcluido) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.cardContainer}>
          <Text style={styles.successTitle}>Cadastro realizado!</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Login')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Ir para o Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.mainContainer}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* Logo e Inputs aqui dentro */}
          <View style={styles.logoWrapper}>
             <View style={styles.logoBg}>
               <Image source={require('@/assets/icon.png')} style={styles.logoImg} resizeMode="contain" />
             </View>
          </View>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Comece a organizar suas finanças</Text>
          
          <View style={styles.inputRow}>
            <User size={18} color={COLORS.mutedForeground} />
            <TextInput placeholder="Nome completo" placeholderTextColor={COLORS.mutedForeground} value={nome} onChangeText={setNome} style={styles.textInput} />
          </View>

          <View style={styles.emailContainer}>
            <View style={styles.inputRow}>
              <Mail size={18} color={COLORS.mutedForeground} />
              <TextInput placeholder="E-mail" placeholderTextColor={COLORS.mutedForeground} value={email} onChangeText={(txt) => { setEmail(txt); verificarSugestaoEmail(txt); }} style={styles.textInput} />
            </View>
            {sugestaoEmail ? (
              <TouchableOpacity style={styles.suggestionBtn} onPress={() => { setEmail(sugestaoEmail); setSugestaoEmail(''); }}>
                <Text style={styles.suggestionText}>Você quis dizer <Text style={styles.boldPrimaryText}>{sugestaoEmail}</Text>?</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.inputRow}>
            <Lock size={18} color={COLORS.mutedForeground} />
            <TextInput placeholder="Senha" placeholderTextColor={COLORS.mutedForeground} value={senha} onChangeText={setSenha} secureTextEntry={!showSenha} style={styles.textInput} />
            <TouchableOpacity onPress={() => setShowSenha(!showSenha)}><Eye size={18} color={COLORS.mutedForeground} /></TouchableOpacity>
          </View>

          {/* ... resto do seu formulário (Barra de força, termos, etc) ... */}
          
          <TouchableOpacity onPress={handleCadastrar} style={[styles.primaryButton, loading && styles.buttonDisabled]} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Criar Conta</Text>}
          </TouchableOpacity>
        </View>

        {/* Links fora do card para rolar */}
        <TouchableOpacity style={styles.loginLinkWrapper} onPress={() => router.push('/login')}>
          <Text style={styles.loginLinkText}>Já possui conta? <Text style={styles.boldPrimaryText}>Entrar</Text></Text>
        </TouchableOpacity>

        {/* NOVOS LINKS: FAQ e TERMOS */}
        <View style={styles.footerLinksContainer}>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Perguntas Frequentes</Text>
          </TouchableOpacity>
          <Text style={styles.bulletPoint}> • </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Termos e Privacidade</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, justifyContent: 'center' },
  centerContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', paddingHorizontal: 20 },
  cardContainer: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, width: '100%' },
  // ... (Mantenha seus outros estilos abaixo normalmente)
  logoWrapper: { alignItems: 'center', marginBottom: 20 },
  logoBg: { width: 80, height: 80, borderRadius: 16, backgroundColor: COLORS.cardElevated, alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 50, height: 50 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.foreground, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.mutedForeground, textAlign: 'center', marginBottom: 28 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, gap: 12 },
  textInput: { flex: 1, color: COLORS.foreground, fontSize: 15, paddingVertical: 0 },
  emailContainer: { marginBottom: 12 },
  suggestionBtn: { paddingHorizontal: 8, marginTop: 4 },
  suggestionText: { fontSize: 12, color: COLORS.mutedForeground },
  boldPrimaryText: { fontWeight: 'bold', color: COLORS.primary },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  loginLinkWrapper: { marginTop: 24, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: COLORS.mutedForeground },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.foreground, textAlign: 'center', marginBottom: 16 },
  footerLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerLink: {
    fontSize: 12,
    color: '#8D8D99',
  },
  bulletPoint: {
    fontSize: 12,
    color: '#8D8D99',
    marginHorizontal: 8,
  },
})
