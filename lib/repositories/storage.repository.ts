import { supabase } from '@/lib/supabase'

export const StorageRepository = {
  async upload(bucket: string, path: string, formData: FormData) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, formData, { upsert: true })
      
    if (error) throw error
  },

  async remover(bucket: string, paths: string[]) {
    const { error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }
}