import { FormCartao } from '@/components/finance/FormCartao'
import { FormConta } from '@/components/finance/FormConta'
import { APP_URL } from "@/constants/vars"
import { useFinance } from '@/contexts/FinanceContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { CATEGORIA_ICONS } from '@/lib/categoria-icons'
import { COLORS } from "@/lib/colors"
import type { Cartao, Categoria, Conta } from '@/lib/types'
import { Circle, Landmark } from 'lucide-react-native'
import React, { useState } from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { FormCategoria } from './FormCategoria'
import { ModalFullscreen } from './ModalFullscreen'

type GerenciarTipo = 'Contas' | 'Cartões' | 'Categorias'

interface Props {
  tipo: GerenciarTipo | null
  onClose: () => void
}
/*
const THEME = {
  card: '#1e293b', // slate-800
  border: '#334155', // slate-700
  foreground: '#ffffff',
  textMuted: '#94a3b8', // slate-400
  primary: '#6366F1', // indigo-500 (exemplo de fallback)
  cardElevated: '#1e293b'
}*/

export function ModalGerenciar({ tipo, onClose }: Props) {
  const { dados } = useFinance()
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  const [editandoConta, setEditandoConta] = useState<Conta | null>(null)
  const [editandoCartao, setEditandoCartao] = useState<Cartao | null>(null)
  const [editandoCategoria, setEditandoCategoria] = useState<Categoria | null>(null)
  const [novoConta, setNovoConta] = useState(false)
  const [novoCartao, setNovoCartao] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState(false)

  if (!tipo) return null

  function abrirNovo() {
    if (tipo === 'Contas') setNovoConta(true)
    else if (tipo === 'Cartões') setNovoCartao(true)
    else setNovaCategoria(true)
  }

  const ordenarAlfabetica = (a: { nome: string }, b: { nome: string }) => {
    return a.nome.trim().localeCompare(b.nome.trim(), 'pt-BR', { sensitivity: 'base' })
  }

  return (
    <>
      <ModalFullscreen
        open={true}
        onClose={onClose}
        title={`Gerenciar ${tipo}`}
        backIcon
        rightAction={
          <TouchableOpacity onPress={abrirNovo} hitSlop={10}>
            <Text style={[styles.rightActionText, { color: currentTheme.primary }]}>
              + Novo
            </Text>
          </TouchableOpacity>
        }
      >
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* SEÇÃO: CONTAS */}
          {tipo === 'Contas' && (
            (dados.contas || []).length === 0 ? (
              <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>Nenhuma conta.</Text>
            ) : (
              [...(dados.contas || [])].sort(ordenarAlfabetica).map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.card, { backgroundColor: currentTheme.card }]} 
                  onPress={() => setEditandoConta(c)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    {c.icone ? (
                      <Image
                        source={{ uri: APP_URL + c.icone }}
                        style={[styles.avatarImage, { borderColor: currentTheme.border }]}
                      />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: currentTheme.cardElevated }]}>
                        <Landmark size={24} color={currentTheme.foreground} />
                      </View>
                    )}
                  </View>
                  <View style={styles.contentContainer}>
                    <Text style={[styles.cardTitle, { color: currentTheme.foreground }]}>{c.nome}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )
          )}

          {/* SEÇÃO: CARTÕES */}
          {tipo === 'Cartões' && (
            (dados.cartoes || []).length === 0 ? (
              <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>Nenhum cartão.</Text>
            ) : (
              [...(dados.cartoes || [])].sort(ordenarAlfabetica).map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.card, { backgroundColor: currentTheme.card }]} 
                  onPress={() => setEditandoCartao(c)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    {c.icone ? (
                      <Image
                        source={{ uri: APP_URL + c.icone }}
                        style={styles.cardImageContain}
                      />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: currentTheme.cardElevated }]}>
                        <Landmark size={20} color={currentTheme.foreground} />
                      </View>
                    )}
                  </View>
                  <View style={styles.contentContainer}>
                    <Text style={[styles.cardTitle, { color: currentTheme.foreground }]}>{c.nome}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )
          )}

          {/* SEÇÃO: CATEGORIAS */}
          {tipo === 'Categorias' && (
            (dados.categorias || [])
              .filter(c => c.id !== 'META' && c.id !== 'FATURA' && c.id !== 'SALARIO')
              .length === 0 ? (
                <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>Nenhuma categoria.</Text>
            ) : (
              [...(dados.categorias || [])]
                .filter(c => c.id !== 'META' && c.id !== 'FATURA' && c.id !== 'SALARIO')
                .sort(ordenarAlfabetica)
                .map(c => {
                  const Icone = CATEGORIA_ICONS[c.icone as keyof typeof CATEGORIA_ICONS]?.Icon || Circle

                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.card, { backgroundColor: currentTheme.card }]}
                      onPress={() => setEditandoCategoria(c)}
                      activeOpacity={0.7}
                    >
                      <View 
                        style={[
                          styles.categoriaIconBox, 
                          { backgroundColor: c.cor + '40' }
                        ]}
                      >
                        <Icone size={20} color={c.cor} />
                      </View>

                      <View style={styles.contentContainer}>
                        <Text style={[styles.cardTitle, { color: currentTheme.foreground }]}>
                          {c.nome}
                        </Text>
                        <Text style={[styles.cardSubtitle, { color: currentTheme.textMuted }]}>
                          {c.tipo}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                })
            )
          )}
        </ScrollView>
      </ModalFullscreen>

      {/* Sub-formulários de Criação / Edição */}
      <FormConta
        open={!!editandoConta || novoConta}
        onClose={() => { setEditandoConta(null); setNovoConta(false) }}
        editando={editandoConta}
        onSaved={() => { setEditandoConta(null); setNovoConta(false) }}
      />
      <FormCartao
        open={!!editandoCartao || novoCartao}
        onClose={() => { setEditandoCartao(null); setNovoCartao(false) }}
        editando={editandoCartao}
        onSaved={() => { setEditandoCartao(null); setNovoCartao(false) }}
      />
      <FormCategoria
        open={!!editandoCategoria || novaCategoria}
        onClose={() => { setEditandoCategoria(null); setNovaCategoria(false) }}
        editando={editandoCategoria}
        onSaved={() => { setEditandoCategoria(null); setNovaCategoria(false) }}
      />
    </>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: 16,
    color: theme.background,
  },
  rightActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
    color: theme.mutedForeground,
  },
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
  },
  iconContainer: {
    marginRight: 15,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.border,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardElevated,
  },
  cardImageContain: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  categoriaIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: theme.cardElevated,
  },
  contentContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.foreground,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    color: theme.mutedForeground,
  },
})
