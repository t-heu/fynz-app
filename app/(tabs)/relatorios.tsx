import { SafeAreaView } from 'react-native-safe-area-context'

import RelatoriosApp from '@/components/RelatoriosApp'

export default function Page() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <RelatoriosApp />
    </SafeAreaView>
  )
}