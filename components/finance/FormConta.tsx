import { ModalManual } from '@/components/ui/ModalManual'
import { APP_URL } from "@/constants/vars"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { bancos } from '@/lib/bancos'
import { COLORS } from "@/lib/colors"
import { aplicarMascaraMoeda, fm, lerValorMoeda } from '@/lib/finance-utils'
import { Building2, Check, ChevronLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

interface Props {
  open: boolean
  onClose: () => void
  editando?: any | null
  onSaved?: () => void
}

export function FormConta({ open, onClose, editando, onSaved }: Props) {
  const { dados, salvar } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const [nome, setNome] = useState('')
  const [icone, setIcone] = useState('')
  const [saldoStr, setSaldoStr] = useState('')
  const [negativo, setNegativo] = useState(false)

  const [selecionandoLogo, setSelecionandoLogo] = useState(false)
  const [buscaBanco, setBuscaBanco] = useState('')

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setIcone(editando.icone || '')
      setSaldoStr(fm(Math.abs(parseFloat(String(editando.saldo)) || 0)))
      setNegativo((editando.saldo || 0) < 0)
    } else {
      setNome('')
      setIcone('')
      setSaldoStr('')
      setNegativo(false)
    }
    setSelecionandoLogo(false)
    setBuscaBanco('')
  }, [editando, open])

  const bancosFiltrados = useMemo(() => {
    if (!buscaBanco.trim()) return bancos
    return bancos.filter(b => b.nome.toLowerCase().includes(buscaBanco.toLowerCase()))
  }, [buscaBanco])

  function salvarConta() {
    if (!nome.trim()) return Alert.alert('Aviso', 'Digite o nome da conta!')
    let s = lerValorMoeda(saldoStr)
    if (negativo) s = -s

    const novaConta = {
      id: editando?.id || Date.now(),
      nome: nome.trim(),
      saldo: s,
      icone: icone || '',
    }

    const novosDados = { ...dados }

    if (editando) {
      const novasContas = [...novosDados.contas] 
      const idx = novasContas.findIndex((x: any) => x.id === editando.id)
      novasContas[idx] = novaConta
      novosDados.contas = novasContas

      const novosLancamentos = [...novosDados.lancamentos]
      const lancamentoSaldoIdx = novosLancamentos.findIndex(
        (l: any) => l.fonte === `C-${editando.id}` && l.categoriaId === 0
      )

      if (lancamentoSaldoIdx !== -1) {
        novosLancamentos[lancamentoSaldoIdx] = {
          ...novosLancamentos[lancamentoSaldoIdx],
          valor: Math.abs(s),
          tipo: s >= 0 ? 'Receita' : 'Despesa'
        }
        novosDados.lancamentos = novosLancamentos
      } else if (s !== 0) {
        novosDados.lancamentos = [...novosLancamentos, {
          id: Date.now() + 1,
          tipo: s >= 0 ? 'Receita' : 'Despesa',
          valor: Math.abs(s),
          descricao: '',
          categoriaId: 0,
          fonte: `C-${editando.id}`,
          data: new Date().toISOString().slice(0, 10),
          pago: true,
        }]
      }
    } else {
      novosDados.contas = [...novosDados.contas, novaConta]
    }

    salvar(novosDados)
    onClose()
    onSaved?.()
  }

  function excluir() {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja apagar esta conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            const novosDados = { ...dados, contas: dados.contas.filter((x: any) => x.id !== editando!.id) }
            salvar(novosDados)
            onClose()
            onSaved?.()
          }
        }
      ]
    )
  }

  return (
    <ModalManual
      open={open}
      // Se estiver escolhendo o logo, o botão "voltar" fecha a seleção. Se não, fecha o modal todo.
      onClose={selecionandoLogo ? () => setSelecionandoLogo(false) : onClose}
      title={selecionandoLogo ? "Selecionar Logo" : (editando ? "Gerenciar Conta" : "Nova Conta")}
      headerLeft={
        selecionandoLogo ? (
          <TouchableOpacity onPress={() => setSelecionandoLogo(false)} hitSlop={10}>
            <ChevronLeft size={24} color={currentTheme.foreground} />
          </TouchableOpacity>
        ) : undefined // undefined faz cair no botão "Cancelar" padrão do ModalManual
      }
      headerRight={
        selecionandoLogo ? null : (
          <TouchableOpacity onPress={salvarConta}>
            <Text style={styles.saveBtn}>Salvar</Text>
          </TouchableOpacity>
        )
      }
    >
      {selecionandoLogo ? (
        /* VISTA A: SELEÇÃO DE LOGO DOS BANCOS */
        <View style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <Search size={20} color={currentTheme.mutedForeground} style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar banco..."
              placeholderTextColor={currentTheme.mutedForeground}
              value={buscaBanco}
              onChangeText={setBuscaBanco}
              style={styles.searchInput}
            />
          </View>

          <ScrollView contentContainerStyle={styles.logoGrid}>
            {bancosFiltrados.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum banco encontrado.</Text>
            ) : (
              bancosFiltrados.map(banco => {
                const estaSelecionado = icone === banco.logo
                return (
                  <TouchableOpacity
                    key={banco.id}
                    onPress={() => {
                      setIcone(banco.logo)
                      if (!nome.trim()) {
                        setNome(banco.nome.charAt(0).toUpperCase() + banco.nome.slice(1).replace(/-/g, ' '))
                      }
                      setSelecionandoLogo(false)
                    }}
                    style={styles.gridItem}
                  >
                    <View style={[
                      styles.gridCircle,
                      { borderColor: estaSelecionado ? currentTheme.primary : currentTheme.border, borderWidth: estaSelecionado ? 3 : 1 }
                    ]}>
                      <Image source={{ uri: APP_URL + banco.logo }} style={styles.gridImg} resizeMode="contain" />
                      {estaSelecionado && (
                        <View style={styles.checkBadge}>
                          <Check size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text numberOfLines={1} style={[
                      styles.gridText,
                      { color: estaSelecionado ? currentTheme.primary : currentTheme.mutedForeground, fontWeight: estaSelecionado ? '700' : '500' }
                    ]}>
                      {banco.nome.replace(/-/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                )
              })
            )}
          </ScrollView>
        </View>
      ) : (
        /* VISTA B: FORMULÁRIO PADRÃO DA CONTA */
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Seção do Logo Centralizado */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { boxShadow: icone ? '0px 4px 20px rgba(0,0,0,0.3)' : 'none' }]}>
              {icone ? (
                <Image source={{ uri: APP_URL + icone }} style={styles.logoImg} resizeMode="contain" />
              ) : (
                <Building2 size={48} color={currentTheme.mutedForeground} />
              )}
            </View>

            {/* Ações do Logotipo */}
            <View style={styles.logoActions}>
              <TouchableOpacity onPress={() => setSelecionandoLogo(true)} style={styles.actionBtn}>
                {icone ? <Pencil size={14} color={currentTheme.primary} /> : <Plus size={14} color={currentTheme.primary} />}
                <Text style={styles.actionBtnText}>{icone ? 'Alterar logo' : 'Adicionar logo'}</Text>
              </TouchableOpacity>
              
              {icone && (
                <>
                  <Text style={{ color: currentTheme.border }}>|</Text>
                  <TouchableOpacity onPress={() => setIcone('')} style={styles.actionBtn}>
                    <Trash2 size={14} color={currentTheme.destructive} />
                    <Text style={[styles.actionBtnText, { color: currentTheme.destructive }]}>Remover logo</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Inputs Centralizados */}
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nome da Conta</Text>
              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Ex: Nubank, Itaú..."
                placeholderTextColor={currentTheme.mutedForeground}
                style={styles.nameInput}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Saldo Atual</Text>
              <View style={styles.balanceRow}>
                <TouchableOpacity onPress={() => setNegativo(v => !v)} style={styles.signBtn}>
                  <Text style={[styles.signText, { color: negativo ? currentTheme.destructive : currentTheme.success }]}>
                    {negativo ? '-' : '+'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.currencyPrefix}>R$</Text>
                <TextInput
                  value={saldoStr}
                  onChangeText={text => setSaldoStr(aplicarMascaraMoeda(text))}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor={currentTheme.mutedForeground}
                  style={styles.balanceInput}
                />
              </View>
            </View>
          </View>

          {/* Botão de Excluir */}
          {editando && (
            <TouchableOpacity onPress={excluir} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Excluir Conta</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </ModalManual>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.foreground 
  },
  saveBtn: { 
    color: theme.primary, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  
  scrollContent: { 
    alignItems: 'center', 
    paddingVertical: 30, 
    paddingBottom: 50 
  },
  
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  logoCircle: { 
    width: 115, 
    height: 115, 
    borderRadius: 58, 
    backgroundColor: theme.card, // Ajustado para tema
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: theme.border,
    overflow: 'hidden',
    marginBottom: 16 
  },
  logoImg: { width: 115, height: 115 },
  logoActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  actionBtnText: { color: theme.primary, fontSize: 14, fontWeight: '600' },
  
  formContainer: { width: '100%', maxWidth: 340, paddingHorizontal: 20, gap: 32 },
  inputWrapper: { alignItems: 'center', width: '100%' },
  label: { fontSize: 12, fontWeight: '500', color: theme.mutedForeground, marginBottom: 8, textTransform: 'uppercase' },
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
  
  balanceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    borderBottomWidth: 2, 
    borderBottomColor: theme.border, 
    paddingBottom: 8, 
    width: '100%' 
  },
  signBtn: { paddingHorizontal: 8 },
  signText: { fontSize: 32, fontWeight: '700', color: theme.foreground },
  currencyPrefix: { fontSize: 36, fontWeight: '700', color: theme.foreground },
  balanceInput: { fontSize: 36, fontWeight: '700', color: theme.foreground, textAlign: 'center', minWidth: 150 },
  
  deleteBtn: { 
    width: '88%', 
    maxWidth: 340, 
    borderWidth: 1, 
    borderColor: theme.destructive, 
    backgroundColor: theme.card, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 48 
  },
  deleteBtnText: { color: theme.destructive, fontWeight: 'bold', fontSize: 16 },

  // Estilos da Sub-tela de Logo
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.cardElevated, 
    marginHorizontal: 20, 
    marginTop: 20, 
    marginBottom: 16, 
    borderRadius: 16, 
    paddingHorizontal: 16 
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: theme.foreground, paddingVertical: 16, fontSize: 16 },
  
  logoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, paddingBottom: 40 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
  gridCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: theme.card, 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden' 
  },
  gridImg: { width: 60, height: 60 },
  checkBadge: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    backgroundColor: theme.primary, 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1.5, 
    borderColor: theme.background 
  },
  gridText: { fontSize: 11, textAlign: 'center', marginTop: 6, textTransform: 'capitalize', width: '100%', color: theme.foreground },
  emptyText: { color: theme.mutedForeground, textAlign: 'center', width: '100%', marginTop: 40, fontSize: 14 }
})
