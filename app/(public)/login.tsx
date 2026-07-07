import { router } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
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

import { limparCacheUsuario, login } from '@/lib/storage';

const { width } = Dimensions.get('window');

// Mantendo o estilo consistente com o HomePage
const theme = {
  background: '#000000',
  primary: '#8a05be',
  text: '#FFFFFF',
  muted: '#888888',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function entrar() {
    setLoading(true);
    try {
      await login({ email, senha });
      limparCacheUsuario();
    } catch (err: any) {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Efeito Glow igual ao HomePage */}
      <View style={styles.glowTop} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header com botão voltar minimalista */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>

        {/* Branding (Igual ao HomePage) */}
        <View style={styles.brandContainer}>
          <Text style={styles.title}>Bem-vindo de{'\n'}volta.</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar gerenciando suas finanças.</Text>
        </View>

        {/* Form Container (Estilo Glassmorphism) */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Mail size={20} color={theme.muted} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={theme.muted} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={theme.muted}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
              {mostrarSenha ? <Eye size={20} color={theme.muted} /> : <EyeOff size={20} color={theme.muted} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotButton} onPress={() => router.push('/esqueci-senha')}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={entrar} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/register')}>
          <Text style={styles.registerText}>Não tem conta? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Cadastre-se</Text></Text>
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
  scrollContainer: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backButton: { marginBottom: 40, alignSelf: 'flex-start' },
  brandContainer: { marginBottom: 40 },
  title: { fontSize: 40, fontWeight: '900', color: theme.text, lineHeight: 45, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: theme.muted, marginTop: 12 },
  formContainer: { gap: 16 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, 
    borderRadius: 16, paddingHorizontal: 16, height: 60 
  },
  input: { flex: 1, marginLeft: 12, color: '#fff', fontSize: 16 },
  forgotButton: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: theme.muted, fontSize: 14 },
  primaryButton: { 
    backgroundColor: theme.primary, height: 60, borderRadius: 100, 
    justifyContent: 'center', alignItems: 'center', marginTop: 16 
  },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  registerLink: { alignItems: 'center', marginTop: 32 },
  registerText: { color: theme.muted, fontSize: 16 }
});