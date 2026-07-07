import { ModalManual } from '@/components/ui/ModalManual'
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { CATEGORIA_ICONS } from '@/lib/categoria-icons'
import { COLORS, PALETA } from '@/lib/colors'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

interface Props {
  open: boolean
  onClose: () => void
  editando?: any | null
  defaultTipo?: 'Despesa' | 'Receita'
  onSaved?: (cat: any) => void
}

export function FormCategoria({ open, onClose, editando, defaultTipo = 'Despesa', onSaved }: Props) {
  const { dados, salvar } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const [tipo, setTipo] = useState<'Despesa' | 'Receita'>(defaultTipo)
  const [nome, setNome] = useState('')
  const [icone, setIcone] = useState('home')
  const [cor, setCor] = useState(PALETA[0])

  useEffect(() => {
    if (editando) {
      setTipo(editando.tipo)
      setNome(editando.nome)
      setIcone(editando.icone || 'home')
      setCor(editando.cor || PALETA[0])
    } else {
      setTipo(defaultTipo)
      setNome('')
      setIcone('home')
      setCor(PALETA[0])
    }
  }, [editando, open, defaultTipo])

  function salvarCategoria() {
    if (!nome.trim()) return Alert.alert('Aviso', 'Digite o nome da categoria!')
    
    const novaCat = {
      id: editando?.id || Date.now(),
      nome: nome.trim(),
      tipo,
      icone,
      cor,
    }
    
    const novosDados = { ...dados }
    if (editando) {
      const idx = novosDados.categorias.findIndex((x: any) => x.id === editando.id)
      novosDados.categorias[idx] = novaCat
    } else {
      novosDados.categorias = [...novosDados.categorias, novaCat]
    }
    
    salvar(novosDados)
    onClose()
    onSaved?.(novaCat)
  }

  function excluir() {
    Alert.alert(
      'Excluir',
      'Apagar esta categoria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Apagar', 
          style: 'destructive',
          onPress: () => {
            const novosDados = { ...dados, categorias: dados.categorias.filter((x: any) => x.id !== editando!.id) }
            salvar(novosDados)
            onClose()
          }
        }
      ]
    )
  }

  return (
    <ModalManual
      open={open}
      onClose={onClose}
      title="Categoria"
      headerRight={
        <TouchableOpacity onPress={salvarCategoria}>
          <Text style={styles.saveBtn}>Salvar</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator
      >
        {/* TABS */}
        <View style={styles.tabsContainer}>
          {(['Despesa', 'Receita'] as const).map(t => {
            const isSelected = tipo === t
            const activeColor =
              t === 'Despesa'
                ? currentTheme.destructive
                : currentTheme.success

            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTipo(t)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isSelected
                      ? activeColor
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isSelected
                        ? '#FFF'
                        : currentTheme.mutedForeground,
                    },
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ÍCONES */}
        <View style={styles.section}>
          <Text style={styles.label}>ÍCONE</Text>

          <ScrollView
            style={{ maxHeight: 220 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            contentContainerStyle={{
              paddingBottom: 0,
              justifyContent: 'flex-start',
            }}
          >
            <View style={styles.gridContainer}>
              {Object.entries(CATEGORIA_ICONS).map(([id, item]) => {
                const Icon = item.Icon
                const isSelected = icone === id

                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setIcone(id)}
                    style={[
                      styles.iconBtn,
                      {
                        borderColor: isSelected
                          ? currentTheme.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    <Icon
                      size={24}
                      color={
                        isSelected
                          ? currentTheme.primary
                          : currentTheme.mutedForeground
                      }
                    />
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        </View>

        {/* NOME */}
        <View style={styles.section}>
          <Text style={styles.label}>NOME DA CATEGORIA</Text>

          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Alimentação..."
            placeholderTextColor={currentTheme.mutedForeground}
            style={styles.input}
          />
        </View>

        {/* CORES */}
        <View style={styles.section}>
          <Text style={styles.label}>COR NO GRÁFICO</Text>

          <View style={styles.colorsContainer}>
            {PALETA.map(c => {
              const isSelected = cor === c

              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCor(c)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isSelected && styles.colorCircleSelected,
                  ]}
                />
              )
            })}
          </View>
        </View>

        {/* DELETE */}
        {editando &&
          editando.id !== 'META' &&
          editando.id !== 'FATURA' &&
          editando.id !== 'SALARIO' && (
            <View style={styles.section}>
              <TouchableOpacity
                onPress={excluir}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>
                  Excluir Categoria
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </ScrollView>
    </ModalManual>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  title: { fontSize: 18, fontWeight: 'bold', color: theme.foreground },
  saveBtn: { color: theme.primary, fontSize: 16, fontWeight: 'bold' },
  
  tabsContainer: { 
    flexDirection: 'row', 
    margin: 20, 
    backgroundColor: theme.card, 
    borderRadius: 12, 
    overflow: 'hidden' 
  },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: 'bold' },

  section: { 
    marginHorizontal: 20, 
    marginBottom: 24,
  },
  label: { fontSize: 12, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 12, textTransform: 'uppercase' },
  
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
  },
  iconBtn: { 
    width: '23%', 
    height: 75,
    backgroundColor: theme.cardElevated, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12,
    borderWidth: 2
  },

  input: { 
    backgroundColor: theme.cardElevated, 
    color: theme.foreground, 
    padding: 16, 
    borderRadius: 16, 
    fontSize: 16 
  },

  colorsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', gap: 12, 
    justifyContent: 'center'
  },
  colorCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    borderWidth: 3, 
    borderColor: 'transparent' 
  },
  colorCircleSelected: { 
    borderColor: '#FFF', 
    transform: [{ scale: 1.15 }] 
  },

  deleteBtn: { 
    backgroundColor: theme.card, 
    borderWidth: 1, 
    borderColor: theme.destructive, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10 
  },
  deleteBtnText: { color: theme.destructive, fontWeight: 'bold', fontSize: 16 }
})