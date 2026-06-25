import { SafeAreaView } from 'react-native-safe-area-context'

import { TabHome } from '@/components/DashboardApp'

export default function Page() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <TabHome />
    </SafeAreaView>
  )
}