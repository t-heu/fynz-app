import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/hooks/use-auth';
import { BackupService } from '@/lib/services/backup.service';
import { Redirect, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PublicLayout() {
  const { user, loading } = useAuth();
  const { setDados } = useFinance();
  
  // Estado para controlar se já terminamos de buscar os dados
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      if (user && !dataLoaded && !isSyncing) {
        setIsSyncing(true);
        try {
          const data = await BackupService.restaurarBackupNuvem();
          if (data) setDados(data);
        } catch (err) {
          console.error("Erro ao restaurar:", err);
        } finally {
          setDataLoaded(true);
          setIsSyncing(false);
        }
      }
    }

    carregarDados();
  }, [user]);

  // 1. Enquanto o Auth está validando o token inicial, não faz nada
  if (loading) return null;

  // 2. Se o usuário estiver logado, mas ainda estamos baixando o backup, 
  // mostra um loading para não redirecionar "vazio"
  if (user && !dataLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 3. Se o usuário logou e os dados já foram carregados, redireciona
  if (user && dataLoaded) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Slot />
    </SafeAreaView>
  )
}