import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://jwmteznfjrzoxlbunprp.supabase.co/',
  'sb_publishable_nocg_eNhzdxPEqfLN03kRA_8Otv0PDF',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
