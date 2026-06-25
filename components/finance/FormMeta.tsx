import { APP_URL } from "@/constants/vars"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { COLORS } from "@/lib/colors"
import { aplicarMascaraMoeda, dtISO, fm, lerValorMoeda } from '@/lib/finance-utils'
import { Building2, Calendar, Check, ChevronDown, ChevronLeft, Target, Wallet } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

interface Props {
  open: boolean
  onClose: () => void
  editando?: any | null
  onSaved?: () => void
}

export function FormMeta({ open, onClose, editando, onSaved }: Props) {
  const { dados, salvar } = useFinance()
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light;
  const styles = getStyles(currentTheme)

  const [nome, setNome] = useState('')
  const [objetivoStr, setObjetivoStr] = useState('')
  const [prazo, setPrazo] = useState(dtISO())
  const [contaId, setContaId] = useState('')
  
  // Controle do modal de seleção de conta vinculada
  const [selecionandoConta, setSelecionandoConta] = useState(false)

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setObjetivoStr(fm(editando.objetivo))
      setPrazo(editando.prazo)
      setContaId(String(editando.contaId))
    } else {
      setNome('')
      setObjetivoStr('')
      setPrazo(dtISO())
      setContaId(dados.contas[0] ? String(dados.contas[0].id) : '')
    }
    setSelecionandoConta(false)
  }, [editando, open, dados.contas])

  const contaSelecionada = useMemo(() => {
    return dados.contas.find((c: any) => String(c.id) === contaId)
  }, [contaId, dados.contas])

  // Ordenação das contas para listagem no seletor
  const contasOrdenadas = useMemo(() => {
    return [...(dados.contas || [])].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [dados.contas])

  function salvarMeta() {
    const obj = lerValorMoeda(objetivoStr)

    if (!nome.trim() || !obj) {
      return Alert.alert('Aviso', 'Preencha o nome e o valor da meta!')
    }

    if (!contaId) {
      return Alert.alert('Aviso', 'Selecione uma conta!')
    }

    const contaSelecionada = dados.contas.find(
      (c: any) => c.id === parseInt(contaId)
    )

    if (!contaSelecionada) {
      return Alert.alert('Aviso', 'A conta selecionada não existe!')
    }

    const nova = {
      id: editando?.id || Date.now(),
      nome: nome.trim(),
      objetivo: obj,
      depositado: editando?.depositado || 0,
      prazo,
      contaId: parseInt(contaId),
    }

    const novosDados = { ...dados }

    if (editando) {
      if (editando.contaId != nova.contaId && editando.depositado > 0) {
        const contaAntiga = novosDados.contas.find(
          (c: any) => c.id == editando.contaId
        )
        const contaNova = novosDados.contas.find(
          (c: any) => c.id == nova.contaId
        )

        if (contaAntiga) contaAntiga.saldo += editando.depositado
        if (contaNova) contaNova.saldo -= editando.depositado
      }

      const idx = novosDados.metas.findIndex(
        (x: any) => x.id === editando.id
      )
      novosDados.metas[idx] = nova
    } else {
      novosDados.metas = [...novosDados.metas, nova]
    }

    salvar(novosDados)
    onClose()
    onSaved?.()
  }

  function excluir() {
    if ((editando?.depositado || 0) > 0) {
      return Alert.alert(
        'Não é possível excluir',
        'Esta meta possui valor guardado. Resgate todo o saldo antes de excluí-la.'
      )
    }

    Alert.alert(
      'Excluir Meta',
      'Deseja realmente apagar esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            const metaId = editando!.id

            const novosDados = {
              ...dados,
              metas: dados.metas.filter((x: any) => x.id !== metaId),
              lancamentos: dados.lancamentos.filter(
                (l: any) => l.metaId !== metaId
              ),
            }

            salvar(novosDados)
            onClose()
            onSaved?.()
          }
        }
      ]
    )
  }

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        
        {/* Header Principal */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelBtn}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editando ? "Gerenciar Meta" : "Nova Meta"}</Text>
          <TouchableOpacity onPress={salvarMeta}>
            <Text style={styles.saveBtn}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Ícone Hero Centralizado */}
          <View style={styles.heroContainer}>
            <View style={styles.heroCircle}>
              <Target size={44} color={currentTheme.primary} />
            </View>
            <Text style={styles.heroTag}>Objetivo</Text>
          </View>

          {/* Inputs Principais Centralizados */}
          <View style={styles.formGroupCentral}>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Viagem, Carro Novo..."
              placeholderTextColor={currentTheme.mutedForeground}
              style={styles.nameInput}
            />

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Valor Desejado</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.currencyPrefix}>R$</Text>
                <TextInput
                  value={objetivoStr}
                  onChangeText={text => setObjetivoStr(aplicarMascaraMoeda(text))}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor={currentTheme.mutedForeground}
                  style={styles.balanceInput}
                />
              </View>
            </View>
          </View>

          {/* Configurações em Blocos */}
          <View style={styles.blocksContainer}>
            
            {/* Bloco: Prazo */}
            <View style={styles.cardBlock}>
              <Text style={styles.blockLabel}>
                <Calendar size={14} color={currentTheme.mutedForeground} />   Prazo para Conclusão
              </Text>
              <TextInput
                value={prazo}
                onChangeText={setPrazo}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={currentTheme.mutedForeground}
                maxLength={10}
                style={styles.blockInput}
              />
            </View>

            {/* Bloco: Seleção Customizada de Conta */}
            <TouchableOpacity onPress={() => setSelecionandoConta(true)} style={styles.cardBlock}>
              <Text style={styles.blockLabel}>
                <Wallet size={14} color={currentTheme.mutedForeground} />   Conta Vinculada
              </Text>
              
              <View style={styles.selectorRow}>
                <View style={styles.accountIconCircle}>
                  {contaSelecionada?.icone ? (
                    <Image source={{ uri: APP_URL + contaSelecionada.icone }} style={styles.accountIcon} resizeMode="contain" />
                  ) : (
                    <Building2 size={18} color={currentTheme.mutedForeground} />
                  )}
                </View>
                
                <Text style={styles.selectorText}>
                  {contaSelecionada ? contaSelecionada.nome : 'Selecionar conta'}
                </Text>
                
                <ChevronDown size={20} color={currentTheme.mutedForeground} />
              </View>
              
              <Text style={styles.blockHint}>
                Todo dinheiro depositado nesta meta ficará atrelado a esta conta.
              </Text>
            </TouchableOpacity>

          </View>

          {/* Botão de Exclusão */}
          {editando && (
            <TouchableOpacity onPress={excluir} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Excluir Meta</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Sub-tela: Picker de Conta Vinculada */}
        <Modal visible={selecionandoConta} animationType="slide" onRequestClose={() => setSelecionandoConta(false)}>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setSelecionandoConta(false)}>
                <ChevronLeft size={24} color={currentTheme.foreground} />
              </TouchableOpacity>
              <Text style={styles.title}>Vincular Conta</Text>
              <View style={{ width: 24 }} />
            </View>

            {contasOrdenadas.length === 0 && (
              <Text style={styles.emptyText}>Nenhuma conta cadastrada.</Text>
            )}

            <ScrollView contentContainerStyle={styles.listContainer}>
              {contasOrdenadas.map((c: any) => {
                const estaAtiva = contaId === String(c.id)
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      setContaId(String(c.id))
                      setSelecionandoConta(false)
                    }}
                    style={[styles.listItemRow, estaAtiva && styles.listItemRowActive]}
                  >
                    <View style={styles.listItemLeft}>
                      <View style={styles.accountIconCircleList}>
                        {c.icone ? (
                          <Image source={{ uri: APP_URL + c.icone }} style={styles.accountIcon} resizeMode="contain" />
                        ) : (
                          <Building2 size={18} color={currentTheme.mutedForeground} />
                        )}
                      </View>
                      <Text style={styles.listItemName}>{c.nome}</Text>
                    </View>
                    {estaAtiva && <Check size={20} color={currentTheme.primary} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </Modal>

      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  cancelBtn: { color: theme.mutedForeground, fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: theme.foreground },
  saveBtn: { color: theme.primary, fontSize: 16, fontWeight: '700' },
  
  scrollContent: { alignItems: 'center', paddingVertical: 24, paddingBottom: 40 },
  
  heroContainer: { alignItems: 'center', marginBottom: 32 },
  heroCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: theme.cardElevated, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3, 
    borderColor: theme.primary,
  },
  heroTag: { fontSize: 12, fontWeight: 'bold', color: theme.primary, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
  
  formGroupCentral: { width: '100%', maxWidth: 340, paddingHorizontal: 20, gap: 24, marginBottom: 36 },
  nameInput: { 
    width: '100%', 
    textAlign: 'center', 
    fontSize: 28, 
    fontWeight: '700', 
    color: theme.foreground, 
    borderBottomWidth: 2, 
    borderBottomColor: theme.border,
    paddingBottom: 8
  },
  balanceContainer: { alignItems: 'center', width: '100%' },
  balanceLabel: { fontSize: 12, fontWeight: '500', color: theme.mutedForeground, marginBottom: 8, textTransform: 'uppercase' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderBottomWidth: 2, borderBottomColor: theme.border, paddingBottom: 8, width: '100%' },
  currencyPrefix: { fontSize: 36, fontWeight: '700', color: theme.primary },
  balanceInput: { fontSize: 36, fontWeight: '700', color: theme.foreground, textAlign: 'center', minWidth: 150 },
  
  blocksContainer: { width: '100%', paddingHorizontal: 20, gap: 16 },
  cardBlock: { backgroundColor: theme.cardElevated, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'transparent' },
  blockLabel: { fontSize: 12, fontWeight: '700', color: theme.mutedForeground, marginBottom: 10, textTransform: 'uppercase', flexDirection: 'row', alignItems: 'center' },
  blockInput: { fontSize: 18, fontWeight: '700', color: theme.foreground, padding: 0 },
  
  selectorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  accountIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginRight: 12 },
  accountIcon: { width: 36, height: 36 },
  selectorText: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.foreground },
  blockHint: { fontSize: 11, color: theme.mutedForeground, marginTop: 12, lineHeight: 16 },

  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.mutedForeground,
    margin: 10
  },
  
  deleteBtn: { 
    width: '90%', 
    maxWidth: 340, 
    borderWidth: 1, 
    borderColor: theme.destructive, 
    backgroundColor: theme.card, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 40 
  },
  deleteBtnText: { color: theme.destructive, fontWeight: 'bold', fontSize: 16 },

  // Estilos da Sub-tela Listagem de Contas
  listContainer: { paddingVertical: 12 },
  listItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  listItemRowActive: { backgroundColor: theme.card },
  listItemLeft: { flexDirection: 'row', alignItems: 'center' },
  accountIconCircleList: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginRight: 16 },
  listItemName: { fontSize: 16, fontWeight: '600', color: theme.foreground }
});
