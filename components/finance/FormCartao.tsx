import { ModalManual } from '@/components/ui/ModalManual'
import { APP_URL } from "@/constants/vars"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { bancos } from '@/lib/bancos'
import { COLORS } from "@/lib/colors"
import { aplicarMascaraMoeda, fm, lerValorMoeda } from '@/lib/finance-utils'
import { ChevronLeft, CreditCard } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export function FormCartao({ open, onClose, editando, onSaved }: any) {
  const { dados, salvar } = useFinance()
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light;
  const styles = getStyles(currentTheme)

  const [nome, setNome] = useState('')
  const [icone, setIcone] = useState('')
  const [limiteStr, setLimiteStr] = useState('')
  const [fechamento, setFechamento] = useState('1')
  const [vencimento, setVencimento] = useState('10')
  const [contaId, setContaId] = useState('')
  const [selecionandoLogo, setSelecionandoLogo] = useState(false)
  const [buscaBanco, setBuscaBanco] = useState('')

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setIcone(editando.icone || '')
      setLimiteStr(fm(parseFloat(String(editando.limite)) || 0))
      setFechamento(String(editando.fechamento))
      setVencimento(String(editando.vencimento))
      setContaId(String(editando.contaPagamento))
    } else {
      // Limpa os campos ao abrir um novo formulário limpo
      setNome('')
      setIcone('')
      setLimiteStr('')
      setFechamento('1')
      setVencimento('10')
      setContaId('')
    }
    setSelecionandoLogo(false)
    setBuscaBanco('')
  }, [editando, open])

  const bancosFiltrados = useMemo(() => 
    bancos.filter(b => b.nome.toLowerCase().includes(buscaBanco.toLowerCase())), [buscaBanco])

  function salvarCartao() {
    if (!nome.trim()) return Alert.alert('Aviso', 'Digite o nome do cartão!')
    const novoCartao = {
      id: editando?.id || Date.now(),
      icone,
      nome: nome.trim(),
      limite: lerValorMoeda(limiteStr),
      fechamento: parseInt(fechamento),
      vencimento: parseInt(vencimento),
      contaPagamento: parseInt(contaId)
    }
    const novosDados = { ...dados }
    if (editando) {
      const idx = novosDados.cartoes.findIndex((x: any) => x.id === editando.id)
      novosDados.cartoes[idx] = novoCartao
    } else {
      novosDados.cartoes = [...novosDados.cartoes, novoCartao]
    }
    salvar(novosDados)
    onClose()
    onSaved?.()
  }

  return (
    <ModalManual
      open={open}
      // Se estiver escolhendo o logo, o voltar fecha apenas a seleção. Se não, fecha o fluxo todo.
      onClose={selecionandoLogo ? () => setSelecionandoLogo(false) : onClose}
      title={selecionandoLogo ? "Selecionar Logo" : (editando ? "Gerenciar Cartão" : "Novo Cartão")}
      headerLeft={
        selecionandoLogo ? (
          <TouchableOpacity onPress={() => setSelecionandoLogo(false)} hitSlop={10}>
            <ChevronLeft size={24} color={currentTheme.foreground} />
          </TouchableOpacity>
        ) : undefined // undefined mantém o "Cancelar" padrão do ModalManual
      }
      headerRight={
        selecionandoLogo ? null : (
          <TouchableOpacity onPress={salvarCartao}>
            <Text style={styles.saveBtn}>Salvar</Text>
          </TouchableOpacity>
        )
      }
    >
      {selecionandoLogo ? (
        /* VISTA A: SELEÇÃO DE LOGO DOS BANCOS */
        <View style={{ flex: 1 }}>
          <TextInput
            style={styles.searchBar}
            placeholder="Buscar..."
            placeholderTextColor={currentTheme.mutedForeground}
            value={buscaBanco}
            onChangeText={setBuscaBanco}
          />

          <ScrollView contentContainerStyle={styles.grid}>
            {bancosFiltrados.map(b => (
              <TouchableOpacity
                key={b.id}
                onPress={() => {
                  setIcone(b.logo)
                  // Preenche o nome do cartão se estiver em branco
                  if (!nome.trim()) {
                    setNome(b.nome.charAt(0).toUpperCase() + b.nome.slice(1).replace(/-/g, ' '))
                  }
                  setSelecionandoLogo(false)
                }}
                style={styles.gridItem}
              >
                <Image
                  source={{ uri: APP_URL + b.logo }}
                  style={styles.gridImg}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        /* VISTA B: FORMULÁRIO PRINCIPAL DO CARTÃO */
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              {icone ? <Image source={{ uri: APP_URL + icone }} style={styles.logoImg} /> : <CreditCard size={48} color="#8D8D99" />}
            </View>
            <TouchableOpacity onPress={() => setSelecionandoLogo(true)} style={styles.editLogoBtn}>
              <Text style={{ color: '#8257E5', fontWeight: 'bold' }}>{icone ? 'Alterar logo' : 'Adicionar logo'}</Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>NOME DO CARTÃO</Text>
            <TextInput 
              value={nome} 
              onChangeText={setNome} 
              style={styles.input} 
              placeholder="Ex: Nubank..." 
              placeholderTextColor={currentTheme.mutedForeground}
            />
            
            <Text style={styles.label}>LIMITE TOTAL</Text>
            <TextInput 
              value={limiteStr} 
              onChangeText={t => setLimiteStr(aplicarMascaraMoeda(t))} 
              style={styles.input} 
              keyboardType="numeric" 
              placeholder="R$ 0,00"
              placeholderTextColor={currentTheme.mutedForeground}
            />
          </View>
        </ScrollView>
      )}
    </ModalManual>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: theme.foreground 
  },
  saveBtn: { 
    color: theme.primary, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  logoSection: { 
    alignItems: 'center', 
    marginVertical: 30 
  },
  logoCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: theme.cardElevated, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  logoImg: { 
    width: 100, 
    height: 100, 
    borderRadius: 50 
  },
  editLogoBtn: { 
    marginTop: 10 
  },
  formGroup: { 
    padding: 20 
  },
  label: { 
    fontSize: 10, 
    color: theme.mutedForeground, 
    marginBottom: 5 
  },
  input: { 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border, 
    color: theme.foreground, 
    fontSize: 18, 
    marginBottom: 20, 
    paddingBottom: 5 
  },
  searchBar: { 
    backgroundColor: theme.cardElevated, 
    padding: 15, 
    margin: 20, 
    borderRadius: 12, 
    color: theme.foreground 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 10 
  },
  gridItem: { 
    width: '25%', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  gridImg: { 
    width: 60, 
    height: 60, 
    borderRadius: 30 
  }
})
