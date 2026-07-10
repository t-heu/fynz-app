import { getPasswordStrength } from '@/lib/finance-utils'
import { AuthService } from '@/lib/services/auth.service'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

export default function RedefinirSenhaPage() {
  const router = useRouter()

  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Estados para controlar a visibilidade das senhas
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)

  const passwordStrength = getPasswordStrength(senha)

  const strengthLabel = [
    'Muito fraca',
    'Fraca',
    'Regular',
    'Boa',
    'Forte',
    'Muito forte',
  ][passwordStrength]

  const strengthColor = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#3b82f6',
    '#22c55e',
    '#16a34a',
  ][passwordStrength]

  async function salvar() {
    setErro('')

    if (passwordStrength < 4) {
      setErro(
        'A senha é muito fraca. Garanta que ela tenha maiúsculas, minúsculas, números e símbolos.'
      )
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    try {
      setLoading(true)

      await AuthService.updatePassword(senha)

      // No Mobile, usamos o Alert nativo ao invés do alert do navegador
      Alert.alert('Sucesso', 'Senha atualizada com sucesso!', [
        { text: 'OK', onPress: () => router.push('/login') }
      ])
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
          <View style={styles.iconBox}>
            <Ionicons name="lock-open-outline" size={40} color="#eee" />
          </View>

          <Text style={styles.title}>Nova Senha</Text>

          <Text style={styles.subtitle}>
            Crie uma senha forte para proteger sua conta
          </Text>

          {/* NOVA SENHA */}
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#eee" />
            <TextInput
              placeholder="Nova senha"
              placeholderTextColor="#666"
              value={senha}
              onChangeText={setSenha}
              style={styles.input}
              secureTextEntry={!mostrarSenha}
            />
            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Ionicons
                name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* FORÇA DA SENHA (Visualizador adicionado para consistência) */}
          {senha ? (
            <Text style={[styles.strengthText, { color: strengthColor }]}>
              Força da senha: {strengthLabel}
            </Text>
          ) : null}

          <View style={styles.strengthBarBg}>
            <View
              style={[
                styles.strengthBar,
                {
                  width: `${(passwordStrength / 5) * 100}%`,
                  backgroundColor: strengthColor,
                },
              ]}
            />
          </View>

          {/* CONFIRMAR SENHA */}
          <View style={styles.inputBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#eee" />
            <TextInput
              placeholder="Confirmar senha"
              placeholderTextColor="#666"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              style={styles.input}
              secureTextEntry={!mostrarConfirmarSenha}
            />
            <TouchableOpacity onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}>
              <Ionicons
                name={mostrarConfirmarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* ERRO */}
          {erro ? <Text style={styles.error}>{erro}</Text> : null}

          {/* BOTÃO SALVAR */}
          <TouchableOpacity
            style={styles.button}
            onPress={salvar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Salvar Nova Senha</Text>
            )}
          </TouchableOpacity>

          {/* LINK CANCELAR / VOLTAR */}
          <TouchableOpacity 
            onPress={() => router.push('/login')}
            style={{ marginTop: 20 }}
          >
            <Text style={styles.link}>Cancelar e Voltar</Text>
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
    paddingTop: height * 0.10, // Mantém o card fixado no topo de forma elegante
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
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#eee',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#a0a0a0',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
    backgroundColor: '#121212'
  },
  input: {
    flex: 1,
    padding: 0,
    color: '#eee',
    backgroundColor: '#121212',
  },
  strengthText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  strengthBarBg: {
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16, // Espaçamento extra antes do próximo input
  },
  strengthBar: {
    height: '100%',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#8a05be',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
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