import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
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

import { useFinance } from '@/contexts/FinanceContext';
import { login, restaurarBackupNuvem } from '@/lib/storage';

// Simulação das variáveis CSS que você usava no Next.js
const theme = {
  background: '#121212', // var(--background)
  card: '#1E1E1E',       // var(--card)
  cardElevated: '#2C2C2C',// var(--card-elevated)
  border: '#333333',     // var(--border)
  primary: '#8a05be',    // var(--primary)
  mutedForeground: '#A1A1AA', // var(--muted-foreground)
  destructive: '#EF4444',// var(--destructive)
  text: '#FFFFFF',
};

export default function LoginPage() {
  const { setDados } = useFinance()

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function entrar() {
    if (!email || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      
      // 1. Autenticação
      setLoadingMessage('Autenticando...');
      await login({ email, senha });

      // 2. Sincronização automática do backup
      setLoadingMessage('Sincronizando seus dados...');
      try {
        const data = await restaurarBackupNuvem();
        if (data) setDados(data)
      } catch (backupError) {
        // Ignoramos silenciosamente se não houver backup ou falhar
      }

      // 3. Redirecionamento
      setLoadingMessage('Redirecionando...');
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      setErro(err.message || 'Erro ao realizar login');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <TouchableOpacity 
              onPress={() => router.push('/')}
              style={styles.logoWrapper}
              activeOpacity={0.8}
            >
              <Image
                source={require('@/assets/icon.png')} // Atualize o caminho para a sua imagem
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>Controle suas finanças em um só lugar</Text>

          {/* EMAIL */}
          <View style={styles.inputContainer}>
            <Mail size={18} color={theme.mutedForeground} />
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor={theme.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* SENHA */}
          <View style={styles.inputContainer}>
            <Lock size={18} color={theme.mutedForeground} />
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor={theme.mutedForeground}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setMostrarSenha(!mostrarSenha)}
              style={styles.eyeButton}
            >
              {mostrarSenha ? (
                <EyeOff size={18} color={theme.mutedForeground} />
              ) : (
                <Eye size={18} color={theme.mutedForeground} />
              )}
            </TouchableOpacity>
          </View>

          {/* ESQUECI A SENHA */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={() => router.push('/esqueci-senha')}>
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

          {/* ERRO */}
          {!!erro && (
            <Text style={styles.errorText}>{erro}</Text>
          )}

          {/* BOTÃO ENTRAR */}
          <TouchableOpacity
            onPress={entrar}
            disabled={loading}
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>{loadingMessage}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* LINK CADASTRO */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Não possui uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>Criar conta</Text>
          </TouchableOpacity>
        </View>
        
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.border,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    backgroundColor: theme.cardElevated,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.mutedForeground,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: theme.text,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: theme.primary,
  },
  errorText: {
    fontSize: 14,
    color: theme.destructive,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Nota: gap em flexDirection: 'row' funciona no RN 0.71+
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: theme.mutedForeground,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  footerLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerLink: {
    fontSize: 12,
    color: theme.mutedForeground,
  },
  bulletPoint: {
    fontSize: 12,
    color: theme.mutedForeground,
    marginHorizontal: 8,
  },
});