import { getPasswordStrength } from '@/lib/finance-utils';
import { AuthService } from '@/lib/services/auth.service';
import { router } from 'expo-router';
// Importações adicionais: CheckCircle2 incluído e markAccountCreatedForConfigTour simulado conforme o Next.js
//import { markAccountCreatedForConfigTour } from '@/components/AppWalkthrough';
import { CheckCircle2, ChevronLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
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
  background: '#111111', // Ajustado ligeiramente para bater com o #111 do web
  primary: '#8a05be',
  text: '#FFFFFF',
  muted: '#888888',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  destructive: '#EF4444',
  success: '#22c55e'
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
  
  // Novos estados adicionados baseados no Next.js
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [cadastroConcluido, setCadastroConcluido] = useState(false);

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
    // 1. Validação de senhas idênticas
    if (senha !== confirmarSenha) { 
      setErro('As senhas não coincidem. Por favor, digite a mesma senha nos dois campos.'); 
      return; 
    }

    // 2. Validação estrita de caracteres
    const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!senhaForteRegex.test(senha)) {
      setErro('A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.');
      return;
    }

    // 3. Validação de Termos
    if (!aceitouTermos) {
      setErro('Você precisa aceitar os termos de uso para continuar.');
      return;
    }

    try {
      setLoading(true); setErro('');
      await AuthService.register({ email, senha, nome });
      
      // Sinaliza para o tour rodar
      // markAccountCreatedForConfigTour();
      
      // Abre a tela de sucesso
      setCadastroConcluido(true);
    } catch (err: any) { 
      setErro(err.message || 'Ocorreu um erro ao tentar realizar o cadastro.'); 
    } finally { 
      setLoading(false);
    }
  }

  // TELA DE SUCESSO DO CADASTRO
  if (cadastroConcluido) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <View style={[styles.glowTop, { top: '30%', opacity: 0.1 }]} />
        
        <View style={styles.successIconContainer}>
          <CheckCircle2 size={40} color={theme.success} />
        </View>
        
        <Text style={styles.successTitle}>Pronto!</Text>
        
        <Text style={styles.successText}>
          Enviamos um e-mail de confirmação para {'\n'}
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{email}</Text>.{'\n\n'}
          Verifique sua caixa de entrada e clique no link antes de acessar sua conta.
        </Text>

        <TouchableOpacity 
          style={[styles.primaryButton, { width: '100%' }]} 
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.primaryButtonText}>Ir para o Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TELA DE CADASTRO
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
          
          {/* NOME */}
          <View style={styles.inputContainer}>
            <User size={20} color={theme.muted} />
            <TextInput style={styles.input} placeholder="Nome completo" placeholderTextColor={theme.muted} value={nome} onChangeText={setNome} />
          </View>

          {/* EMAIL */}
          <View style={styles.emailWrapper}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={theme.muted} />
              <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor={theme.muted} value={email} onChangeText={(txt) => { setEmail(txt); verificarSugestaoEmail(txt); }} onBlur={() => verificarSugestaoEmail(email)} autoCapitalize="none" keyboardType="email-address" />
            </View>
            
            {/* SUGESTÃO DE EMAIL */}
            {sugestaoEmail ? (
              <TouchableOpacity style={styles.suggestionBtn} onPress={() => { setEmail(sugestaoEmail); setSugestaoEmail(''); }}>
                <Text style={styles.suggestionText}>Você quis dizer <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{sugestaoEmail}</Text>?</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* SENHA */}
          <View style={styles.inputContainer}>
            <Lock size={20} color={theme.muted} />
            <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={theme.muted} value={senha} onChangeText={setSenha} secureTextEntry={!showSenha} />
            <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={{ padding: 4 }}>
              {showSenha ? <Eye size={20} color={theme.muted} /> : <EyeOff size={20} color={theme.muted} />}
            </TouchableOpacity>
          </View>

          {/* CONFIRMAR SENHA */}
          <View style={styles.inputContainer}>
            <Lock size={20} color={theme.muted} />
            <TextInput style={styles.input} placeholder="Confirmar senha" placeholderTextColor={theme.muted} value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry={!showConfirmarSenha} />
            <TouchableOpacity onPress={() => setShowConfirmarSenha(!showConfirmarSenha)} style={{ padding: 4 }}>
              {showConfirmarSenha ? <Eye size={20} color={theme.muted} /> : <EyeOff size={20} color={theme.muted} />}
            </TouchableOpacity>
          </View>

          {/* FORÇA E REQUISITOS DA SENHA */}
          {senha.length > 0 && (
            <View style={styles.passwordRulesContainer}>
              <Text style={[styles.strengthText, { color: strengthColors[passwordStrength] }]}>
                Segurança: {strengthLabels[passwordStrength]}
              </Text>
              
              <View style={styles.checklistContainer}>
                <Text style={[styles.checklistItem, senha.length >= 8 && { color: theme.success }]}>
                  ✓ Mínimo 8 caracteres
                </Text>
                <Text style={[styles.checklistItem, /[A-Z]/.test(senha) && { color: theme.success }]}>
                  ✓ Uma letra maiúscula
                </Text>
                <Text style={[styles.checklistItem, /[a-z]/.test(senha) && { color: theme.success }]}>
                  ✓ Uma letra minúscula
                </Text>
                <Text style={[styles.checklistItem, /(?=.*\d)(?=.*[^A-Za-z0-9])/.test(senha) && { color: theme.success }]}>
                  ✓ Um número e caractere especial
                </Text>
              </View>
            </View>
          )}

          {/* TERMOS */}
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            activeOpacity={0.7}
            onPress={() => setAceitouTermos(!aceitouTermos)}
          >
            <View style={[styles.checkbox, aceitouTermos && styles.checkboxActive]}>
              {aceitouTermos && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              Eu li e aceito os <Text style={{ color: '#fff', fontWeight: '500' }}>Termos de Uso</Text> e a <Text style={{ color: '#fff', fontWeight: '500' }}>Política de Privacidade</Text>.
            </Text>
          </TouchableOpacity>

          {/* ERRO */}
          {!!erro && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{erro}</Text>
            </View>
          )}

          {/* BOTÃO */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleCadastrar} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Criar conta</Text>}
          </TouchableOpacity>
        </View>

        {/* LINK LOGIN */}
        <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/login')}>
          <Text style={styles.loginLinkText}>Já possui conta? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Entrar</Text></Text>
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
  backButton: { 
    marginBottom: 20, 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, 
    borderColor: theme.border, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { marginBottom: 32 },
  title: { fontSize: 40, fontWeight: '900', color: theme.text, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: theme.muted, marginTop: 8 },
  formContainer: { gap: 16 },
  emailWrapper: { gap: 8 },
  suggestionBtn: { paddingHorizontal: 16 },
  suggestionText: { color: theme.primary, fontSize: 13 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, 
    borderRadius: 16, paddingHorizontal: 16, height: 60 
  },
  input: { flex: 1, marginLeft: 12, color: '#fff', fontSize: 16, height: '100%' },
  passwordRulesContainer: { marginTop: -4, marginLeft: 4, marginBottom: 8 },
  strengthText: { fontSize: 13, fontWeight: '600' },
  checklistContainer: { marginTop: 8, gap: 4 },
  checklistItem: { color: theme.muted, fontSize: 12 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4, paddingRight: 16 },
  checkbox: { 
    width: 20, height: 20, borderRadius: 4, borderWidth: 1, 
    borderColor: theme.border, backgroundColor: theme.inputBg, 
    justifyContent: 'center', alignItems: 'center', marginTop: 2 
  },
  checkboxActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkboxText: { color: theme.muted, fontSize: 13, flex: 1, lineHeight: 20 },
  errorContainer: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  errorText: { color: theme.destructive, textAlign: 'center', fontSize: 14 },
  primaryButton: { 
    backgroundColor: theme.primary, height: 60, borderRadius: 100, 
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: theme.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginLink: { alignItems: 'center', marginTop: 32, paddingBottom: 20 },
  loginLinkText: { color: theme.muted, fontSize: 16 },

  // Estilos da Tela de Sucesso
  successContainer: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIconContainer: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: 'rgba(34, 197, 94, 0.2)', 
    justifyContent: 'center', alignItems: 'center', 
    marginBottom: 24 
  },
  successTitle: { fontSize: 36, fontWeight: '900', color: theme.text, marginBottom: 16 },
  successText: { color: theme.muted, textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 32 }
});