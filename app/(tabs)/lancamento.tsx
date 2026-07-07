import { Plus } from 'lucide-react-native'
import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { FormLancamento } from '@/components/FormLancamento'
import LancamentoApp from '@/components/LancamentoApp'

export default function Page() {
  const [fabOpen, setFabOpen] = useState(false)

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1 }}>
          <LancamentoApp />

          {/* BOTÃO FLUTUANTE */}
          <TouchableOpacity
            onPress={() => setFabOpen(true)}
            style={styles.fab}
          >
            <Plus size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FormLancamento open={fabOpen} onClose={() => setFabOpen(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  }
})