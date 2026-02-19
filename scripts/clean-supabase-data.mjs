import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bfozyiabmrdayqrbnsri.supabase.co'
const supabaseServiceKey = 'sb_secret_M9Ril_WIy3NogbhJMckHtg_FC_S2L4g'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanSupabase() {
  try {
    console.log('🧹 Limpando dados de teste do Supabase...')

    // 1. Encontrar o usuário de teste
    console.log('🔍 Buscando usuário de teste...')
    const { data: users } = await supabase.auth.admin.listUsers()
    const testUser = users?.users?.find(u => u.email === 'fabiano@scout.com')

    if (!testUser) {
      console.log('ℹ️ Nenhum usuário de teste encontrado')
      return
    }

    console.log('✅ Usuário encontrado:', testUser.id)

    // 2. Deletar atletas do usuário de teste
    console.log('🗑️ Deletando atletas de teste...')
    const { data: atletasParaDeletar } = await supabase
      .from('atletas')
      .select('id')
      .eq('user_id', testUser.id)

    if (atletasParaDeletar && atletasParaDeletar.length > 0) {
      const { error } = await supabase
        .from('atletas')
        .delete()
        .eq('user_id', testUser.id)

      if (error) {
        console.error('❌ Erro ao deletar atletas:', error)
      } else {
        console.log(`✅ ${atletasParaDeletar.length} atletas deletados`)
      }
    } else {
      console.log('ℹ️ Nenhum atleta para deletar')
    }

    console.log('🎉 Limpeza concluída!')
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

cleanSupabase()
