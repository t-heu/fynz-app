import { SafeAreaView } from 'react-native-safe-area-context'

import MetaApp from '@/components/MetaApp'

export default function Page() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <MetaApp />
    </SafeAreaView>
  )
}