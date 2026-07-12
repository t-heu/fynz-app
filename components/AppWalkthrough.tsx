import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, Sparkles, Trophy, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useFinance } from '@/contexts/FinanceContext';

const { width } = Dimensions.get('window');

const theme = {
  background: '#111111',
  primary: '#8a05be',
  text: '#FFFFFF',
  muted: '#888888',
  card: '#1a1a1a',
  cardElevated: '#222222',
  border: 'rgba(255, 255, 255, 0.1)',
};

const TAB_FLOW = ['home', 'lancamentos', 'relatorios', 'metas'] as const;
type FlowTab = (typeof TAB_FLOW)[number];

type TourStep = {
  title: string;
  content: string;
  arrow?: 'up' | 'down';
};

let globalActiveTourInstanceId: string | null = null;

export async function markAccountCreatedForConfigTour() {
  await AsyncStorage.setItem('pending_config_tour_v8', 'true');
}

export async function clearAllTutorialProgress() {
  const keys = ['tour_home_v8', 'tour_lanc_v8', 'tour_relat_v8', 'tour_metas_v8', 'tour_config_v8', 'tour_congrats_v8'];
  await AsyncStorage.multiRemove(keys);
  await AsyncStorage.setItem('pending_config_tour_v8', 'true');
}

export async function goToDashboardAndRestartTour() {
  router.replace({ pathname: '/(tabs)/dashboard', params: { restartTour: '1' } });
}

export default function AppWalkthrough() {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [dynamicPosition, setDynamicPosition] = useState<any>(null);
  
  const { activeTab, setActiveTab } = useFinance();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [instanceId] = useState(() => Math.random().toString(36).substring(7));

  useEffect(() => {
    return () => {
      if (globalActiveTourInstanceId === instanceId) globalActiveTourInstanceId = null;
    };
  }, [instanceId]);

  useEffect(() => {
    if (params.restartTour === '1') {
      setActiveTab('home' as any);
      router.setParams({ restartTour: undefined });
    }
  }, [params.restartTour, setActiveTab]);

  // Solicita o posicionamento dinâmico sempre que mudar o passo corrente
  useEffect(() => {
    if (run) {
      setDynamicPosition(null); // Limpa o estado antigo para evitar flashes de posicionamento incorreto
      DeviceEventEmitter.emit('tour-request-target', { activeTab, stepIndex: currentStepIndex });
    }
  }, [currentStepIndex, run, activeTab]);

  // Escuta o retorno com as coordenadas medidas na tela ativa
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tour-target-position', (data) => {
      if (!data) {
        setDynamicPosition(null);
        return;
      }

      const { y, height, stepIndex } = data;
      if (stepIndex !== currentStepIndex) return;

      const windowHeight = Dimensions.get('window').height;
      const currentStep = steps[stepIndex];

      if (currentStep?.arrow === 'down') {
        // Posiciona o balão perfeitamente ACIMA do componente medido
        setDynamicPosition({
          position: 'absolute',
          bottom: windowHeight - y + 6,
          left: 0,
          right: 0,
          alignItems: 'center',
        });
      } else if (currentStep?.arrow === 'up') {
        // Posiciona o balão perfeitamente ABAIXO do componente medido
        setDynamicPosition({
          position: 'absolute',
          top: y + height + 6,
          left: 0,
          right: 0,
          alignItems: 'center',
        });
      } else {
        setDynamicPosition(null);
      }
    });

    return () => sub.remove();
  }, [currentStepIndex, steps]);

  useEffect(() => {
    const handleCustomFinishFlow = async () => {
      setRun(false);
      if (globalActiveTourInstanceId === instanceId) globalActiveTourInstanceId = null;

      const isConfigPage = pathname.includes('/settings');
      if (isConfigPage) return;

      const currentIndex = TAB_FLOW.indexOf(activeTab as FlowTab);
      const nextTab = currentIndex >= 0 ? TAB_FLOW[currentIndex + 1] : undefined;

      if (nextTab) {
        setTimeout(() => {
          setActiveTab(nextTab as any);
          if (nextTab === 'home') router.push('/(tabs)/dashboard');
          else if (nextTab === 'lancamentos') router.push('/(tabs)/lancamento');
          else if (nextTab === 'relatorios') router.push('/(tabs)/relatorios');
          else if (nextTab === 'metas') router.push('/(tabs)/meta');
        }, 500);
      } else {
        await AsyncStorage.setItem('tour_congrats_v8', 'true');
        setShowCongrats(true);
      }
    };

    const subscription = DeviceEventEmitter.addListener('tour-custom-finish', handleCustomFinishFlow);
    return () => { subscription.remove(); };
  }, [activeTab, setActiveTab, pathname, instanceId]);

  useEffect(() => {
    const checkTourStatus = async () => {
      let currentSteps: TourStep[] = [];

      const [seenHome, seenLancamentos, seenRelatorios, seenMetas, seenConfig, pendingConfigTour] = await Promise.all([
        AsyncStorage.getItem('tour_home_v8'),
        AsyncStorage.getItem('tour_lanc_v8'),
        AsyncStorage.getItem('tour_relat_v8'),
        AsyncStorage.getItem('tour_metas_v8'),
        AsyncStorage.getItem('tour_config_v8'),
        AsyncStorage.getItem('pending_config_tour_v8')
      ]);

      const isConfigPage = pathname.includes('/settings');

      if (isConfigPage) {
        if (pendingConfigTour === 'true' && !seenConfig) {
          currentSteps = [
            { title: 'Configurações', content: 'Aqui você tem controle total sobre sua conta e o aplicativo.' },
            { title: 'Perfil e Assinatura', content: 'Edite seu perfil, altere sua senha por segurança e gerencie sua assinatura.' },
            { title: 'Backup e Exportação', content: 'Faça backup manual dos seus dados, sincronize e exporte suas planilhas em CSV.' },
            { title: 'Suporte', content: 'Acesse o FAQ, Termos de Uso, ou acesse a Zona de Perigo para resetar o app.' },
          ];
        }
      } else {
        if (activeTab === 'home' && !seenHome) {
          currentSteps = [
            { title: 'Boas-vindas ao Fynz!', content: 'Vamos fazer um tour rápido.\n\nPreparamos tudo para você ter uma experiência incrível cuidando do seu dinheiro.' },
            { title: 'Gerenciar Contas', content: 'Aqui você cadastra e ajusta suas contas bancárias.\n\nClique para alterar o nome, escolher a logo do seu banco e inserir seu saldo inicial.', arrow: 'up' },
            { title: 'Gerenciar Cartões', content: 'Cadastre seus cartões de crédito aqui para acompanhar de perto suas faturas e seus limites disponíveis.', arrow: 'down' },
            { title: 'Categorias de Gastos', content: 'Categorizar é o segredo. Clique em "Novo" para criar categorias e definir cores para seus gráficos.', arrow: 'down' },
          ];
        } else if (activeTab === 'lancamentos' && !seenLancamentos) {
          currentSteps = [
            { title: 'Seus Lançamentos', content: 'É aqui que a mágica acontece: registre todas as suas movimentações no dia a dia para ter controle total do seu dinheiro.' },
            { arrow: 'up', title: 'Visão Geral do Mês', content: 'Aqui você vê o total de entradas, saídas, o que ainda está a pagar e o balanço total.' },
            { arrow: 'up', title: 'Filtros Inteligentes', content: 'Filtre e visualize rapidamente todos os lançamentos, apenas os Pagos ou Pendentes.' },
            { arrow: 'down', title: 'Novo Lançamento', content: 'O botão mais importante! Insira o valor, indique se é entrada/saída, categoria e configure repetições.' },
          ];
        } else if (activeTab === 'relatorios' && !seenRelatorios) {
          currentSteps = [
            { title: 'Seus Relatórios', content: 'Acompanhe graficamente para onde vai seu dinheiro.\n\n💡 Dica: Clique em uma categoria para ver o histórico detalhado.' },
          ];
        } else if (activeTab === 'metas' && !seenMetas) {
          currentSteps = [
            { title: 'Acompanhe suas Metas', content: 'Aqui ficam seus grandes objetivos financeiros organizados de forma simples.' },
            { arrow: 'up', title: 'Criar Primeira Meta', content: 'Clique aqui para criar um objetivo, definir prazos e vincular a uma conta.'},
          ];
        }
      }

      if (currentSteps.length > 0) {
        if (globalActiveTourInstanceId === null || globalActiveTourInstanceId === instanceId) {
          globalActiveTourInstanceId = instanceId;
          setSteps(currentSteps);
          setCurrentStepIndex(0);
          setRun(true);

          if (isConfigPage) {
            await AsyncStorage.setItem('tour_config_v8', 'true');
            await AsyncStorage.removeItem('pending_config_tour_v8');
          } 
          else if (activeTab === 'home') await AsyncStorage.setItem('tour_home_v8', 'true');
          else if (activeTab === 'lancamentos') await AsyncStorage.setItem('tour_lanc_v8', 'true');
          else if (activeTab === 'relatorios') await AsyncStorage.setItem('tour_relat_v8', 'true');
          else if (activeTab === 'metas') await AsyncStorage.setItem('tour_metas_v8', 'true');
        } else {
          setRun(false);
        }
      } else {
        if (globalActiveTourInstanceId === instanceId) globalActiveTourInstanceId = null;
        setRun(false);
      }
    };

    const timer = setTimeout(() => { checkTourStatus(); }, 600);
    return () => clearTimeout(timer);
  }, [activeTab, pathname, instanceId]);

  const handleResetTutorial = async () => {
    await clearAllTutorialProgress();
    setShowCongrats(false);
    await goToDashboardAndRestartTour();
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) setCurrentStepIndex(prev => prev + 1);
    else handleFinish();
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  };

  const handleFinish = () => {
    setRun(false);
    if (globalActiveTourInstanceId === instanceId) globalActiveTourInstanceId = null;
    setTimeout(() => { DeviceEventEmitter.emit('tour-custom-finish'); }, 50);
  };

  if (!run && !showCongrats) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <>
      <Modal visible={run} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          {currentStep && (
            <View 
              key={`${activeTab}_step_${currentStepIndex}`}
              style={[
                styles.positionWrapper,
                dynamicPosition ? dynamicPosition : { flex: 1, justifyContent: 'center' }
              ]}
            >
              {currentStep.arrow === 'up' && <View style={styles.arrowUp} />}
              
              <View style={styles.tooltipContainer}>
                <View style={styles.glowTopRight} />
                <TouchableOpacity style={styles.closeButton} onPress={handleFinish}>
                  <X size={18} color={theme.muted} />
                </TouchableOpacity>

                <View style={styles.tooltipContent}>
                  <View style={styles.tooltipHeader}>
                    <View style={styles.iconBox}>
                      <Sparkles size={24} color="#fff" />
                    </View>
                    <Text style={styles.tooltipTitle}>{currentStep.title}</Text>
                  </View>
                  <Text style={styles.tooltipText}>{currentStep.content}</Text>
                </View>

                <View style={styles.tooltipFooter}>
                  <Text style={styles.stepIndicator}>PASSO {currentStepIndex + 1}</Text>
                  <View style={styles.actionsContainer}>
                    {currentStepIndex > 0 && (
                      <TouchableOpacity style={styles.backButton} onPress={handlePrev}>
                        <ChevronLeft size={18} color={theme.text} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                      <Text style={styles.primaryButtonText}>{isLastStep ? 'Concluir' : 'Próximo'}</Text>
                      {isLastStep ? <Check size={16} color="#fff" strokeWidth={3} /> : <ChevronRight size={16} color="#fff" strokeWidth={3} />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {currentStep.arrow === 'down' && <View style={styles.arrowDown} />}
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={showCongrats} transparent animationType="fade" statusBarTranslucent>
        <View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={styles.congratsContainer}>
            <View style={styles.trophyBox}><Trophy size={32} color="#22c55e" /></View>
            <Text style={styles.congratsTitle}>Parabéns!</Text>
            <Text style={styles.congratsText}>Você concluiu o tutorial. Caso esteja com dúvidas, você pode rever novamente em configurações.</Text>
            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity style={styles.primaryButtonBlock} onPress={() => setShowCongrats(false)}>
                <Text style={styles.primaryButtonText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButtonBlock} onPress={handleResetTutorial}>
                <Text style={styles.secondaryButtonText}>Rever Tutorial</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent', padding: 20 },
  positionWrapper: { width: '100%' },
  arrowUp: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#FFFFFF', marginBottom: -1, zIndex: 99 },
  arrowDown: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 14, borderRightWidth: 14, borderTopWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFFFF', marginTop: -1, zIndex: 99 },
  tooltipContainer: { width: width * 0.9, maxWidth: 400, backgroundColor: theme.card, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  glowTopRight: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: theme.primary, opacity: 0.15 },
  closeButton: { position: 'absolute', top: 20, right: 20, zIndex: 20, padding: 4 },
  tooltipContent: { padding: 24, paddingTop: 28, zIndex: 10 },
  tooltipHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  tooltipTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: theme.text },
  tooltipText: { fontSize: 14, color: '#b3b3b3', lineHeight: 22 },
  tooltipFooter: { paddingVertical: 16, paddingHorizontal: 24, backgroundColor: theme.cardElevated, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepIndicator: { fontSize: 11, fontWeight: '800', color: theme.muted, letterSpacing: 1 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111111', borderWidth: 1, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, height: 40, borderRadius: 20, backgroundColor: theme.primary },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  congratsContainer: { width: width * 0.9, maxWidth: 350, backgroundColor: theme.card, borderRadius: 24, borderWidth: 1, borderColor: theme.border, padding: 32, alignItems: 'center' },
  trophyBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(34, 197, 94, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  congratsTitle: { fontSize: 24, fontWeight: '900', color: theme.text, marginBottom: 12 },
  congratsText: { fontSize: 14, color: theme.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  primaryButtonBlock: { width: '100%', height: 56, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonBlock: { width: '100%', height: 56, borderRadius: 16, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: theme.muted, fontSize: 14, fontWeight: 'bold' },
});