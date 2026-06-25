import { resetPassword } from '@/lib/storage'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

const { height } = Dimensions.get('window');

export default function EsqueciSenhaPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  async function recuperarSenha() {
    try {
      setLoading(true)
      setErro('')
      setSucesso(false)

      await resetPassword(email)

      setSucesso(true)
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Caixa de Ícone no topo para manter o padrão visual das outras telas */}
          <View style={styles.iconBox}>
            <Ionicons name="mail-outline" size={40} color="#eee" />
          </View>

          <Text style={styles.title}>Recuperar senha</Text>

          <Text style={styles.subtitle}>
            Informe seu e-mail para receber o link de recuperação.
          </Text>

          {/* INPUT E-MAIL */}
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color="#eee" />
            <TextInput
              placeholder="Seu e-mail"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* SE ESTIVER COM ERRO */}
          {erro ? <Text style={styles.error}>{erro}</Text> : null}

          {/* SE FOR SUCESSO */}
          {sucesso ? (
            <Text style={styles.success}>
              ✓ Verifique seu e-mail para redefinir a senha.
            </Text>
          ) : null}

          {/* BOTÃO ENVIAR */}
          <TouchableOpacity
            style={styles.button}
            onPress={recuperarSenha}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar link</Text>
            )}
          </TouchableOpacity>

          {/* LINK PARA VOLTAR AO LOGIN */}
          <TouchableOpacity 
            onPress={() => router.push('/login')}
            style={{ marginTop: 20 }}
          >
            <Text style={styles.link}>Voltar para o Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#0b0b0b',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    // Como esta tela tem poucos elementos, 15% joga o card em uma altura excelente no mobile
    paddingTop: height * 0.15, 
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#eee',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
    backgroundColor: '#121212'
  },
  input: {
    flex: 1,
    padding: 0,
    color: '#eee',
    backgroundColor: '#121212',
  },
  error: {
    color: '#ef4444',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  success: {
    color: '#22c55e',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#8a05be',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    color: '#8a05be',
    fontWeight: '600',
  },
})
