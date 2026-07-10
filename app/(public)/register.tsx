import { getPasswordStrength } from '@/lib/finance-utils';
import { AuthService } from '@/lib/services/auth.service';
import { router } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

const { width } = Dimensions.get('window');

const theme = {
  background: '#000000',
  primary: '#8a05be',
  text: '#FFFFFF',
  muted: '#888888',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  destructive: '#EF4444',
};

const PROVEDORES_BASE = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 
  'icloud.com', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'live.com'
];

function calcularSimilaridade(digitado: string, alvo: string): number {
  if (digitado === alvo) return 1;
  const a = digitado.toLowerCase();
  const b = alvo.toLowerCase();
  const matriz = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matriz[i][0] = i;
  for (let j = 0; j <= b.length; j++) matriz[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(matriz[i - 1][j] + 1, matriz[i][j - 1] + 1, matriz[i - 1][j - 1] + custo);
    }
  }
  const tamanhoMaximo = Math.max(a.length, b.length);
  const distancia = matriz[a.length][b.length];
  return (tamanhoMaximo - distancia) / tamanhoMaximo;
}

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [sugestaoEmail, setSugestaoEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const passwordStrength = getPasswordStrength(senha);
  const strengthLabels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte', 'Muito forte'];
  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e', '#16a34a'];

  function verificarSugestaoEmail(emailDigitado: string) {
    const partes = emailDigitado.split('@');
    if (partes.length !== 2 || partes[1].length < 2) { setSugestaoEmail(''); return; }
    const usuario = partes[0];
    const dominioDigitado = partes[1].toLowerCase().trim();
    if (PROVEDORES_BASE.includes(dominioDigitado)) { setSugestaoEmail(''); return; }
    let melhorMatch = '';
    let maiorSimilaridade = 0;
    for (const provedor of PROVEDORES_BASE) {
      const similaridade = calcularSimilaridade(dominioDigitado, provedor);
      if (similaridade > maiorSimilaridade) { maiorSimilaridade = similaridade; melhorMatch = provedor; }
    }
    setSugestaoEmail((maiorSimilaridade >= 0.5 && maiorSimilaridade < 1) ? `${usuario}@${melhorMatch}` : '');
  }

  async function handleCadastrar() {
    if (passwordStrength < 4) { setErro('Escolha uma senha mais forte.'); return; }
    try {
      setLoading(true); setErro('');
      await AuthService.register({ email, senha, nome });
      router.replace('/login');
    } catch (err: any) { setErro(err.message || 'Erro ao cadastrar.'); } 
    finally { setLoading(false); }
  }

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />

      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Comece a organizar suas finanças hoje.</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <User size={20} color={theme.muted} />
            <TextInput style={styles.input} placeholder="Nome completo" placeholderTextColor={theme.muted} value={nome} onChangeText={setNome} />
          </View>

          <View style={styles.emailWrapper}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={theme.muted} />
              <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor={theme.muted} value={email} onChangeText={(txt) => { setEmail(txt); verificarSugestaoEmail(txt); }} autoCapitalize="none" keyboardType="email-address" />
            </View>
            {sugestaoEmail ? (
              <TouchableOpacity style={styles.suggestionBtn} onPress={() => { setEmail(sugestaoEmail); setSugestaoEmail(''); }}>
                <Text style={styles.suggestionText}>Você quis dizer <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{sugestaoEmail}</Text>?</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={theme.muted} />
            <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={theme.muted} value={senha} onChangeText={setSenha} secureTextEntry={!showSenha} />
            <TouchableOpacity onPress={() => setShowSenha(!showSenha)}>
              {showSenha ? <Eye size={20} color={theme.muted} /> : <EyeOff size={20} color={theme.muted} />}
            </TouchableOpacity>
          </View>

          {senha.length > 0 && (
            <Text style={[styles.strengthText, { color: strengthColors[passwordStrength] }]}>
              Segurança: {strengthLabels[passwordStrength]}
            </Text>
          )}

          {!!erro && <Text style={styles.errorText}>{erro}</Text>}

          <TouchableOpacity style={styles.primaryButton} onPress={handleCadastrar} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Criar conta</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/login')}>
          <Text style={styles.loginLinkText}>Já tem uma conta? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Entrar</Text></Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  glowTop: {
    position: 'absolute',
    top: '-10%',
    alignSelf: 'center',
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: theme.primary,
    borderRadius: 999,
    opacity: 0.15,
  },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backButton: { marginBottom: 20 },
  header: { marginBottom: 32 },
  title: { fontSize: 40, fontWeight: '900', color: theme.text, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: theme.muted, marginTop: 8 },
  formContainer: { gap: 16 },
  emailWrapper: { gap: 8 },
  suggestionBtn: { paddingHorizontal: 16 },
  suggestionText: { color: theme.muted, fontSize: 13 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, 
    borderRadius: 16, paddingHorizontal: 16, height: 60 
  },
  input: { flex: 1, marginLeft: 12, color: '#fff', fontSize: 16 },
  strengthText: { fontSize: 13, marginTop: -8, marginLeft: 16, fontWeight: '600' },
  errorText: { color: theme.destructive, textAlign: 'center', marginTop: 8 },
  primaryButton: { 
    backgroundColor: theme.primary, height: 60, borderRadius: 100, 
    justifyContent: 'center', alignItems: 'center', marginTop: 8 
  },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginLink: { alignItems: 'center', marginTop: 32 },
  loginLinkText: { color: theme.muted, fontSize: 16 }
});