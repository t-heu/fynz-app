import { supabase } from '@/lib/supabase'

export const BackupRepository = {
  async buscarUltimoBackup(userId: string) {
    const { data, error } = await supabase
      .from('backups_info')
      .select('ultimo_backup')
      .eq('user_id', userId)
      .maybeSingle()
      
    if (error) throw error
    return data?.ultimo_backup
  },

  async registrarDataBackup(userId: string) {
    const { error } = await supabase
      .from('backups_info')
      .upsert({
        user_id: userId,
        ultimo_backup: new Date().toISOString(),
      })
    if (error) throw error
  },

  async uploadBackup(userId: string, jsonString: string) {
    const { error } = await supabase.storage
      .from('backups')
      .upload(`${userId}/backup.json`, jsonString, {
        upsert: true,
        contentType: 'application/json',
      })
    if (error) throw error
  },
  
  async baixarBackup(userId: string) {
    const { data, error } = await supabase.storage
      .from('backups')
      .download(`${userId}/backup.json`)
    
    if (error || !data) return null;
    return data;
  }
}