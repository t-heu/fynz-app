import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import LancamentoApp from '@/components/LancamentoApp'

export default function Page() {

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <LancamentoApp />
    </SafeAreaView>
  )
}
