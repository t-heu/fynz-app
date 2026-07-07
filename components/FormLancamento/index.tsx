import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, CheckCircle2, ChevronRight, Eye, EyeOff, ReceiptText, Repeat, Sigma, WalletCards, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { APP_URL } from "@/constants/vars";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from "@/lib/colors";
import { aplicarMascaraMoeda, fm } from '@/lib/finance-utils';

import { CalculadoraFinanceira } from '@/components/CalculadoraFinanceira';
import { FormCategoria } from '../finance/FormCategoria'; // Ajuste seu path se necessário

// Novos Componentes e Hooks Refatorados
import { useFormLancamento } from '../../hooks/use-form-lancamento';
import { ModalAlertaRepeticao } from './ModalAlertaRepeticao';
import { SheetSeletoresLancamento } from './SheetSeletoresLancamento';

interface Props {
  open: boolean
  onClose: () => void
  editandoId?: number | null
}

export function FormLancamento({ open, onClose, editandoId }: Props) {
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? COLORS.dark : COLORS.light
  const styles = getStyles(currentTheme)

  // Estados de Interface Local (O que é estritamente UI dessa tela)
  const [showCalc, setShowCalc] = useState(false)
  const [showFormCat, setShowFormCat] = useState(false)
  const [openDrawer, setOpenDrawer] = useState<'categoria' | 'fonte' | 'repeticao' | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // 1. Injeta toda a Lógica de Negócio
  const formHook = useFormLancamento(open, onClose, editandoId)
  const { states, setters, computed, actions } = formHook

  // Função adaptada para gerir UI do DatePicker
  const handleDateChange = (event: any, selectedDate: any) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      const ano = selectedDate.getFullYear();
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      setters.setData(`${ano}-${mes}-${dia}`);
    }
    if (event.type === 'set' || event.type === 'dismissed') setShowDatePicker(false);
  };

  return (
    <>
      <Modal presentationStyle="pageSheet" visible={open} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={currentTheme.foreground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{editandoId ? "Editar Lançamento" : "Novo Lançamento"}</Text>
            <TouchableOpacity onPress={actions.salvarLancamento} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={[styles.heroSection, { backgroundColor: computed.isDespesa ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)' }]}>
              
              <View style={[styles.typeSelectorContainer, states.isPagFatura && { opacity: 0.5 }]}>
                <TouchableOpacity disabled={states.isPagFatura} onPress={() => setters.setTipo('Despesa')} style={[styles.typeBtn, computed.isDespesa && { backgroundColor: '#EF4444' }]}>
                  <Text style={[styles.typeBtnText, computed.isDespesa ? { color: '#fff' } : { color: currentTheme.mutedForeground }]}>Saída</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={states.isPagFatura} onPress={() => setters.setTipo('Receita')} style={[styles.typeBtn, !computed.isDespesa && { backgroundColor: '#22C55E' }]}>
                  <Text style={[styles.typeBtnText, !computed.isDespesa ? { color: '#fff' } : { color: currentTheme.mutedForeground }]}>Entrada</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.amountInputRow}>
                <Text style={[styles.currencyPrefix, { color: computed.corPrincipal }]}>R$</Text>
                <TextInput
                  value={states.valorStr}
                  onChangeText={text => setters.setValorStr(aplicarMascaraMoeda(text))}
                  keyboardType="numeric" placeholder="0,00" placeholderTextColor="rgba(128,128,128,0.4)"
                  style={[styles.amountInput, { color: computed.corPrincipal }]}
                />
                <TouchableOpacity onPress={() => setShowCalc(!showCalc)} style={[styles.calcToggleBtn, showCalc ? { backgroundColor: currentTheme.card, borderColor: currentTheme.primary, borderWidth: 2 } : { backgroundColor: currentTheme.primary }]}>
                  <Sigma size={20} color={showCalc ? currentTheme.primary : '#fff'} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <View style={styles.descInputContainer}>
                <ReceiptText size={20} color={computed.corPrincipal} style={{ marginRight: 12, opacity: 0.6 }} />
                <TextInput
                  value={states.descricao} onChangeText={setters.setDescricao}
                  placeholder="No que você gastou?" placeholderTextColor={currentTheme.mutedForeground}
                  style={styles.descTextInput} multiline={true} textAlignVertical="top"
                />
              </View>
            </View>

            {showCalc && (
              <View style={styles.calcWrapper}>
                <CalculadoraFinanceira onApply={(valor) => setters.setValorStr(aplicarMascaraMoeda(Math.round(valor * 100).toString()))} />
              </View>
            )}

            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <View style={styles.cardFormContainer}>
                
                <TouchableOpacity onPress={() => setOpenDrawer('categoria')} style={styles.formRowItem}>
                  <View style={styles.rowItemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: computed.categoriaAtual ? `${computed.categoriaAtual.cor}20` : currentTheme.border }]}>
                      <computed.IconeCat size={20} color={computed.categoriaAtual?.cor || currentTheme.mutedForeground} />
                    </View>
                    <Text style={styles.rowItemLabel}>Categoria</Text>
                  </View>
                  <View style={styles.rowItemRight}>
                    <Text numberOfLines={1} style={[styles.rowItemValue, computed.categoriaAtual && { color: currentTheme.primary }]}>
                      {computed.categoriaAtual ? computed.categoriaAtual.nome : 'Selecionar'}
                    </Text>
                    <ChevronRight size={18} color={currentTheme.mutedForeground} />
                  </View>
                </TouchableOpacity>

                <View style={{ borderBottomWidth: 1, borderColor: currentTheme.border }}>
                  <TouchableOpacity onPress={() => setOpenDrawer('fonte')} style={[styles.formRowItem, { borderBottomWidth: 0 }]}>
                    <View style={styles.rowItemLeft}>
                      <View style={[styles.iconBox, { backgroundColor: '#FFF', borderWidth: 1, borderColor: currentTheme.border }]}>
                        {computed.bancoOrigem ? <Image source={{ uri: APP_URL + computed.bancoOrigem.logo }} style={{ width: 22, height: 22 }} resizeMode="contain" /> : <WalletCards size={20} color={currentTheme.mutedForeground} />}
                      </View>
                      <Text style={styles.rowItemLabel}>Sairá de</Text>
                    </View>
                    <View style={styles.rowItemRight}>
                      <Text numberOfLines={1} style={[styles.rowItemValue, computed.selecionado && { color: currentTheme.primary }]}>
                        {computed.selecionado ? computed.selecionado.nome : 'Selecionar'}
                      </Text>
                      <ChevronRight size={18} color={currentTheme.mutedForeground} />
                    </View>
                  </TouchableOpacity>

                  {computed.selecionado && (
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>{computed.labelSaldoFonte}</Text>
                      <View style={styles.balanceValueContainer}>
                        <Text style={styles.balanceValueText}>
                          {states.showSaldo ? `R$ ${fm(computed.saldoVisivelFonte)}` : 'R$ •••••'}
                        </Text>
                        <TouchableOpacity onPress={() => setters.setShowSaldo(!states.showSaldo)} style={{ padding: 4 }}>
                          {states.showSaldo ? <Eye size={16} color={currentTheme.mutedForeground} /> : <EyeOff size={16} color={currentTheme.mutedForeground} />}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.formRowItem}>
                  <View style={styles.rowItemLeft}>
                    <View style={styles.iconBox}><Calendar size={20} color={currentTheme.foreground} /></View>
                    <Text style={styles.rowItemLabel}>Data</Text>
                  </View>
                  <View style={styles.rowItemRight}>
                    <Text style={[styles.dateInputText, { color: currentTheme.primary }]}>{states.data || "Selecionar"}</Text>
                    <ChevronRight size={18} color={currentTheme.mutedForeground} />
                  </View>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker value={states.data ? new Date(states.data + 'T12:00:00') : new Date()} mode="date" display="default" onChange={handleDateChange} />
                )}

                <TouchableOpacity onPress={() => setOpenDrawer('repeticao')} style={styles.formRowItem}>
                  <View style={styles.rowItemLeft}>
                    <View style={styles.iconBox}><Repeat size={20} color={currentTheme.foreground} /></View>
                    <Text style={styles.rowItemLabel}>Repetição</Text>
                  </View>
                  <View style={styles.rowItemRight}>
                    <Text numberOfLines={1} style={[styles.rowItemValue, states.repType !== 'Unico' && { color: currentTheme.primary }]}>{computed.repTextResumo}</Text>
                    <ChevronRight size={18} color={currentTheme.mutedForeground} />
                  </View>
                </TouchableOpacity>

                <View style={[styles.formRowItem, { borderBottomWidth: 0 }, states.isPagFatura && { opacity: 0.5 }]}>
                  <View style={styles.rowItemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: states.pago ? `${computed.corPrincipal}20` : currentTheme.border }]}>
                      <CheckCircle2 size={20} color={states.pago ? computed.corPrincipal : currentTheme.mutedForeground} />
                    </View>
                    <View>
                      <Text style={styles.rowItemLabel}>Status do Registro</Text>
                      <Text style={[styles.statusSubLabel, { color: states.pago ? computed.corPrincipal : currentTheme.mutedForeground }]}>
                        {states.pago ? 'Liquidado' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                  <Switch disabled={states.isPagFatura} value={states.pago} onValueChange={setters.setPago} trackColor={{ false: currentTheme.border, true: computed.corPrincipal }} thumbColor="#fff" />
                </View>

              </View>
            </View>
          </ScrollView>
        </View>

        {/* MODAIS FILHOS (Totalmente Desacoplados!) */}
        <SheetSeletoresLancamento 
          openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} currentTheme={currentTheme} styles={styles}
          cats={computed.cats} categoriaId={states.categoriaId} setCategoriaId={setters.setCategoriaId} setShowFormCat={setShowFormCat}
          contasOrd={computed.contasOrd} cartoesOrd={computed.cartoesOrd} fonte={states.fonte} setFonte={setters.setFonte}
          repType={states.repType} setRepType={setters.setRepType} repFreq={states.repFreq} setRepFreq={setters.setRepFreq} qtdParcelas={states.qtdParcelas} setQtdParcelas={setters.setQtdParcelas}
        />

        <ModalAlertaRepeticao 
          open={states.modalRepeticaoOpen} 
          onClose={() => setters.setModalRepeticaoOpen(false)} 
          onConfirm={(aplicarProx: boolean) => actions.finalizarSalvar(aplicarProx)} 
          currentTheme={currentTheme} styles={styles} 
        />
      </Modal>

      <FormCategoria open={showFormCat} onClose={() => setShowFormCat(false)} defaultTipo={states.tipo} onSaved={(c: any) => { setters.setCategoriaId(String(c.id)); setShowFormCat(false); }} />
    </>
  )
}

// ⚠️ MANTENHA AQUI TODO O SEU getStyles() EXATAMENTE COMO NO ORIGINAL ⚠️
const { width } = Dimensions.get('window')
const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  saveBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 20,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 4,
    width: '100%',
    maxWidth: 280,
    borderWidth: 1,
    borderColor: theme.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    paddingHorizontal: 40,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '900',
    marginRight: 4,
    marginTop: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 160,
    maxWidth: '80%',
    padding: 0,
  },
  calcToggleBtn: {
    position: 'absolute',
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  descInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderBottomWidth: 2,
    borderColor: theme.border,
    paddingBottom: 6,
  },
  descTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.foreground,
    padding: 0,
  },
  calcWrapper: {
    padding: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  cardFormContainer: {
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  formRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  rowItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowItemLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  statusSubLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  rowItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '50%',
  },
  rowItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.mutedForeground,
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    padding: 0,
    width: 100,
  },
  
  // Drawer / Bottom Sheets Stylings
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    flex: 1,
  },
  drawerContentContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: 500,
  },
  drawerIndicatorRow: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  drawerIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.border,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  drawerCloseIcon: {
    padding: 6,
    backgroundColor: theme.card,
    borderRadius: 20,
  },
  drawerCreateBtn: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  drawerCreateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.mutedForeground,
    marginVertical: 20,
    fontSize: 14,
  },
  drawerItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  drawerItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.foreground,
  },
  drawerSectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: theme.mutedForeground,
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  
  // Repetição Drawer específico
  repTabsBox: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  repTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  repTabBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  freqBubble: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: theme.card,
  },
  freqBubbleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  parcelasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
  },
  parcelaGridItem: {
    width: (width - 64) / 5,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelaGridItemText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  confirmRepBtn: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 30,
  },
  confirmRepBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Alert Modal
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  alertIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.foreground,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    color: theme.mutedForeground,
    lineHeight: 18,
    marginBottom: 20,
  },
  alertPrimaryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  alertPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertSecondaryBtn: {
    backgroundColor: theme.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  alertSecondaryText: {
    color: theme.foreground,
    fontWeight: 'bold',
    fontSize: 14,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.mutedForeground,
  },
  balanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.foreground,
  }
})