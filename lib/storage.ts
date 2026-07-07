import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'
import { router } from 'expo-router'
import * as Sharing from 'expo-sharing'
import { Alert, Platform } from 'react-native'

import { PALETA } from '@/lib/colors'
import { validatePasswordStrength } from '@/lib/finance-utils'
import { supabase } from '@/lib/supabase'
import { traduzirErroAuth } from '@/lib/traduzir-erro-auth'
import { getInfoAssinatura } from "@/lib/utils"
import type { AppData, Assinatura, Categoria, LoginProps, RegisterProps } from './types'

const STORAGE_KEY = 'orgFinancasV8'
const CURRENT_VERSION = 1

export function getDadosIniciais(): AppData {
  return {
    version: CURRENT_VERSION,
    lastModified: new Date().toISOString(),
    contas: [],
    cartoes: [],
    categorias: [
      {
        id: 'META',
        nome: 'Meta',
        tipo: 'Despesa',
        icone: 'goal',
        cor: '#c27aff'
      },
      {
        id: 'FATURA',
        nome: 'Pagamento da Fatura',
        tipo: 'Despesa',
        icone: 'creditcard',
        cor: '#22C55E'
      },
      {
        id: 'SALARIO',
        nome: 'Salário',
        tipo: 'Receita',
        icone: 'money',
        cor: PALETA[9]
      }
    ],
    lancamentos: [],
    metas: []
  }
}

function migrarDados(dados: any): AppData {
  if (!dados.version) dados.version = CURRENT_VERSION
  if (!dados.lastModified) dados.lastModified = new Date().toISOString()
  if (!dados.cartoes) dados.cartoes = []
  if (!dados.metas) dados.metas = []
  if (!dados.categorias) dados.categorias = []

  return dados as AppData
}

// ============================================================================
// AsyncStorage Wrappers
// ============================================================================

async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error('Erro ao buscar dados do AsyncStorage:', error)
    return null
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Erro ao salvar dados no AsyncStorage:', error)
  }
}

async function clearDB(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Erro ao limpar AsyncStorage:', error)
  }
}

// ============================================================================
// Funções Principais de Dados
// ============================================================================

export async function carregarDados(): Promise<AppData> {
  try {
    let dados = await getItem<AppData>(STORAGE_KEY)

    if (!dados) {
      return getDadosIniciais()
    }

    dados = migrarDados(dados)

    if (!dados.categorias.find((c: Categoria) => c.id === 'META')) {
      dados.categorias.push({
        id: 'META',
        nome: 'Meta',
        tipo: 'Despesa',
        icone: 'goal',
        cor: '#fff'
      })
    }

    if (!dados.categorias.find((c: Categoria) => c.id === 'FATURA')) {
      dados.categorias.push({
        id: 'FATURA',
        nome: 'Pagamento da Fatura',
        tipo: 'Despesa',
        icone: 'wallet',
        cor: '#000'
      })
    }

    return dados
  } catch {
    return getDadosIniciais()
  }
}

export async function salvarDados(dados: AppData): Promise<void> {
  dados.lastModified = new Date().toISOString()
  await setItem(STORAGE_KEY, dados)
}

export async function clearData() {
  Alert.alert(
    'Apagar Tudo',
    'Todos os dados registrados serão excluídos permanentemente do aplicativo e não poderão ser recuperados. Tem certeza?',
    [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Sim, excluir', 
        style: 'destructive',
        onPress: async () => {
          await clearDB()
          // No mobile, não existe location.reload().
          // Podemos redirecionar para uma rota de transição ou recarregar a tela atual.
          router.push('/(tabs)/dashboard') 
        }
      }
    ]
  )
}

// ============================================================================
// Backup Nuvem (Supabase Storage)
// ============================================================================

// 👉 REGRA DE LIMITAÇÃO DE BACKUPS POR PLANO
async function validarLimiteBackup(userId: string): Promise<void> {
  const { data: assinatura, error: assinaturaError } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (assinaturaError) throw assinaturaError

  // Vitalício não tem limites, passa direto.
  if (assinatura?.plano_ativo === 'vitalicio') {
    return
  }

  // Define as horas de limite de acordo com o plano
  let limiteHoras = 24 // Gratuito e Mensal começam com 24h
  const semestral = process.env.NEXT_PUBLIC_STRIPE_PLAN_SEMESTRAL
  const anual = process.env.NEXT_PUBLIC_STRIPE_PLAN_ANUAL

  if (assinatura?.status === 'active' || assinatura?.status === 'trialing') {
    if (assinatura.stripe_price_id === semestral) limiteHoras = 12
    else if (assinatura.stripe_price_id === anual) limiteHoras = 6
  }

  const { data, error } = await supabase
    .from('backups_info')
    .select('ultimo_backup')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data?.ultimo_backup) return

  const ultimaData = new Date(data.ultimo_backup)
  const diffMs = Date.now() - ultimaData.getTime()
  const limiteMs = limiteHoras * 60 * 60 * 1000

  if (diffMs < limiteMs) {
    const horasRestantes = Math.ceil((limiteMs - diffMs) / (60 * 60 * 1000))
    throw new Error(`Seu plano permite 1 backup a cada ${limiteHoras}h. Aguarde ${horasRestantes} hora(s) para o próximo.`)
  }
}

async function registrarBackup(userId: string): Promise<void> {
  const { error } = await supabase
    .from('backups_info')
    .upsert({
      user_id: userId,
      ultimo_backup: new Date().toISOString(),
    })

  if (error) throw error
}

export async function fazerBackupNuvem(): Promise<void> {
  try {
    const userId = await obterUsuarioId()
    await validarLimiteBackup(userId)

    const dados = await carregarDados()
    const jsonString = JSON.stringify(dados)
    const caminhoArquivo = `${userId}/backup.json`

    // Upload direto como string (funciona bem para JSON no supabase-js)
    const { error } = await supabase.storage
      .from('backups')
      .upload(caminhoArquivo, jsonString, {
        upsert: true,
        contentType: 'application/json',
      })

    if (error) throw error

    await registrarBackup(userId)
    Alert.alert('Sucesso', 'Backup em nuvem realizado com sucesso!')
  } catch (error: any) {
    Alert.alert('Erro', error.message || 'Erro ao fazer backup')
    console.error('Erro ao fazer backup na nuvem:', error)
    throw error
  }
}

let cacheUsuario: any = null

export function limparCacheUsuario() {
  cacheUsuario = null;
}

export async function getDadosUsuario() {
  if (cacheUsuario) return cacheUsuario;

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // Se não houver usuário, retorne um objeto padrão ou null, mas não quebre
  if (!user) return { id: '', nome: 'Usuário', avatarUrl: '', email: '' };

  cacheUsuario = {
    id: user.id,
    nome: user.user_metadata?.name ?? 'Usuário',
    avatarUrl: user.user_metadata?.avatar_url ?? '',
    email: user.email ?? '',
  };

  return cacheUsuario;
}

export async function obterUsuarioId() {
  return (await getDadosUsuario()).id
}

export async function restaurarBackupNuvem(): Promise<AppData | null> {
  try {
    const userId = await obterUsuarioId();
    if (!userId) return null; // Proteção extra

    const { data: arquivos, error: erroListagem } = await supabase.storage
      .from('backups')
      .list(userId);

    if (erroListagem) {
      console.error("Erro na listagem:", erroListagem);
      return null; // Retorne explicitamente null
    }

    const existeBackup = arquivos?.some((arquivo) => arquivo.name === 'backup.json');
    if (!existeBackup) {
      console.log("Nenhum backup encontrado.");
      return null; // Retorne explicitamente null
    }

    const { data, error } = await supabase.storage
      .from('backups')
      .download(`${userId}/backup.json`);

    if (error || !data) {
      console.error("Erro no download:", error);
      return null; // Retorne explicitamente null
    }

    const texto = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(data);
    });

    if (!texto || !texto.trim()) return null;

    const dadosRestaurados: AppData = JSON.parse(texto);
    
    // Supondo que salvarDados seja uma função local de cache
    await salvarDados(dadosRestaurados);
    
    return dadosRestaurados; // Retorna o objeto completo
  } catch (err) {
    console.error("Erro crítico no backup:", err);
    return null; // Garante que nunca retorne undefined
  }
}

// ============================================================================
// Autenticação e Usuário
// ============================================================================

export async function updateProfileName(fullName: string) {
  const { error } = await supabase.auth.updateUser({ data: { name: fullName } })
  if (error) throw new Error(traduzirErroAuth(error))
}

export async function removeProfilePhoto() {
  const { data: { user } } = await supabase.auth.getUser()
  const avatarPath = user?.user_metadata?.avatar_path

  if (avatarPath) {
    const { error } = await supabase.storage.from('avatars').remove([avatarPath])
    if (error) throw error
  }

  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: null, avatar_path: null },
  })

  if (error) throw new Error(traduzirErroAuth(error))
}

// ATENÇÃO: No React Native não usamos 'File'. Geralmente passamos um objeto de imagem
// vindo do 'expo-image-picker' contendo { uri, name, type }
export async function uploadProfilePhoto(image: { uri: string, name: string, type: string }, userId: string) {
  const fileExt = image.name.split('.').pop()
  const fileName = `${userId}-${crypto.randomUUID()}.${fileExt}`

  const { data: { user } } = await supabase.auth.getUser()
  const oldAvatarPath = user?.user_metadata?.avatar_path

  if (oldAvatarPath) {
    await supabase.storage.from('avatars').remove([oldAvatarPath])
  }

  // Prepara o FormData compatível com o React Native
  const formData = new FormData()
  formData.append('file', {
    uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
    name: fileName,
    type: image.type,
  } as any)

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, formData, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
  const avatarUrl = data.publicUrl

  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl, avatar_path: fileName },
  })

  if (error) throw new Error(traduzirErroAuth(error))
  return avatarUrl
}

export async function validateCurrentPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(traduzirErroAuth(error))
}

export async function updateUserPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(traduzirErroAuth(error))
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  if (!validatePasswordStrength(newPassword)) {
    throw new Error('Mínimo de 8 caracteres, com maiúsculas, minúsculas, números e símbolos.')
  }

  if (newPassword !== confirmPassword) {
    throw new Error('A confirmação não confere.')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('Usuário não encontrado.')

  await validateCurrentPassword(user.email, currentPassword)
  await updateUserPassword(newPassword)

  return true
}

export async function getAssinaturaUsuario() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      plano: 'Plano Gratuito',
      statusPlano: 'Sem assinatura ativa',
      possuiAcesso: false,
      trialExpirou: false,
      assinatura: null,
    }
  }

  const { data, error } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return {
      plano: 'Plano Gratuito',
      statusPlano: 'Sem assinatura ativa',
      possuiAcesso: false,
      trialExpirou: false,
      assinatura: null,
    }
  }

  return {
    ...getInfoAssinatura(data as Assinatura),
    assinatura: data as Assinatura,
  }
}

export async function login({ email, senha }: LoginProps) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  })

  if (error) throw new Error(traduzirErroAuth(error))
  return data
}

export async function register({ nome, email, senha }: RegisterProps) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { name: nome } },
  })

  if (error) throw new Error(traduzirErroAuth(error))
  return data
}

export async function logout(skipConfirmation = false) {
  if (skipConfirmation) return

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    await clearDB()
    cacheUsuario = null
    
    // Substituído o window.location pelo roteamento do Expo
    router.replace('/login')
  } catch (error) {
    console.error('Erro ao realizar logout:', error)
    Alert.alert('Erro', 'Ocorreu um erro ao sair. Por favor, tente novamente.')
  }
}

export async function resetPassword(email: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    // Idealmente você configura o Deep Linking (scheme) no app.json
    // Exemplo: 'meuapp://redefinir-senha'
    redirectTo: redirectTo || 'exp://localhost:8081/--/redefinir-senha', 
  })

  if (error) throw error
  return data
}

export async function updatePassword(senha: string) {
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) throw new Error(traduzirErroAuth(error))
}

export async function excluirConta() {
  try {
    // 1. Obtém o ID do usuário
    const userId = await obterUsuarioId();
    if (!userId) throw new Error("Usuário não identificado.");

    // 2. Busca o status da assinatura antes de permitir a exclusão
    const { data: assinatura, error: assinaturaError } = await supabase
      .from('assinaturas')
      .select('status, plano_ativo')
      .eq('id', userId)
      .maybeSingle();

    if (assinaturaError) throw new Error("Erro ao verificar status da assinatura.");

    // 3. Define se o usuário tem um plano ativo
    // (Ajuste os valores 'active' ou 'trialing' conforme o seu banco de dados)
    const temPlanoAtivo = assinatura && (assinatura.status === 'active' || assinatura.status === 'past_due' || assinatura.plano_ativo === 'vitalicio');

    if (temPlanoAtivo) {
      Alert.alert(
        'Atenção',
        'Você possui uma assinatura ativa. Para excluir sua conta, você deve cancelar sua assinatura no portal de pagamentos primeiro.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    // 4. Se não tem plano ativo, prossegue com o alerta de exclusão
    Alert.alert(
      'Atenção',
      'Todos os dados da sua conta serão apagados e não poderão ser recuperados. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://fynz.dev.br/';
              const res = await fetch(`${apiUrl}/api/delete-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.error);

              await logout(true);
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Erro ao excluir conta.');
            }
          }
        }
      ]
    );
  } catch (err: any) {
    Alert.alert('Erro', err.message || 'Não foi possível verificar seu status.');
  }
}

export async function exportarDadosCSV() {
  try {
    const userId = await obterUsuarioId()
    const usuario = await getDadosUsuario()

    const { data, error } = await supabase.storage
      .from('backups')
      .download(`${userId}/backup.json`)

    if (error || !data) throw error

    // Lendo o Blob no React Native
    const textoBackup = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(data)
    })

    const exportacao = {
      exportadoEm: new Date().toISOString(),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        avatarUrl: usuario.avatarUrl,
      },
      dados: JSON.parse(textoBackup),
    }

    const fileUri = `${FileSystem.documentDirectory}meus-dados.json`
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportacao, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    })

    const isAvailable = await Sharing.isAvailableAsync()
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        dialogTitle: 'Exportar Backup',
        mimeType: 'application/json'
      })
    } else {
      Alert.alert('Erro', 'Compartilhamento de arquivos não disponível neste dispositivo.')
    }

  } catch (err) {
    console.error('Erro ao exportar:', err)
    Alert.alert('Erro', 'Ocorreu um problema ao gerar o arquivo de exportação.')
  }
}