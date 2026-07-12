import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { width } = Dimensions.get('window')

export default function HomePage() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Efeito de Glow (Luz de fundo) para trazer a vibe da imagem */}
      <View style={styles.glowTop} />

      {/* BRANDING / LOGO */}
      <View style={styles.brandContainer}>
        <Image 
          source={require('@/assets/icon.png')} // Ajuste para o caminho real da sua imagem
          style={styles.logoImage} 
          resizeMode="contain" 
        />
        <Text style={styles.brandName}>Fynz</Text>
      </View>
      
      <View style={styles.content}>
        
        {/* GRÁFICO CENTRAL (Simulando o elemento visual principal) */}
        <View style={styles.heroSection}>
          <View style={styles.cardBack} />
          <View style={styles.cardFront}>
            <View style={styles.cardHeader}>
              <Ionicons name="scan-outline" size={24} color="#fff" />
              <Ionicons name="wifi" size={24} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardBalance}>R$ 4.250,00</Text>
              <Text style={styles.cardLabel}>Saldo Disponível</Text>
            </View>
          </View>
          
          {/* Badge flutuante para dar assimetria e charme */}
          <View style={styles.floatingBadge}>
            <Ionicons name="trending-up" size={16} color="#000" />
            <Text style={styles.floatingBadgeText}>+12% este mês</Text>
          </View>
        </View>

        {/* TEXTOS (Tipografia grande e peso forte) */}
        <View style={styles.textSection}>
          <Text style={styles.title}>O futuro das{'\n'}suas finanças.</Text>
          <Text style={styles.subtitle}>
            Acompanhe seus gastos, gerencie cartões e alcance seus objetivos em um ambiente moderno e inteligente.
          </Text>
        </View>

        {/* AÇÕES (Layout empilhado focado na conversão principal) */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryText}>Abrir uma conta</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            activeOpacity={0.6}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginText}>
              Já tem uma conta? <Text style={styles.loginTextHighlight}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // --- BRANDING ---
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    gap: 10,
    marginTop: 15, // Dá um respiro até o gráfico central
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fundo puramente preto para destacar o glow
    justifyContent: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: '#8a05be', // O roxo da sua paleta original
    borderRadius: 999,
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 40,
    marginBottom: 20,
  },
  
  // --- GRÁFICO CENTRAL ---
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 260,
    marginTop: 20,
  },
  cardBack: {
    position: 'absolute',
    width: 220,
    height: 140,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    transform: [{ rotate: '-8deg' }, { translateY: -20 }],
  },
  cardFront: {
    width: 260,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    justifyContent: 'space-between',
    backdropFilter: 'blur(10px)', // Efeito de vidro (suportado em algumas webviews, mas inofensivo no RN)
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardBody: {
    gap: 4,
  },
  cardBalance: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  cardLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff', // Badge branco para contraste máximo
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  floatingBadgeText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },

  // --- TEXTOS ---
  textSection: {
    gap: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 52,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    lineHeight: 24,
    fontWeight: '400',
    paddingRight: 20,
  },

  // --- AÇÕES ---
  actions: {
    gap: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8a05be',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 100, // Formato "pílula" igual ao da imagem
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  loginTextHighlight: {
    color: '#8a05be',
    fontWeight: 'bold',
  },
})