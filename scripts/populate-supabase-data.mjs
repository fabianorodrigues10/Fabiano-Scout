import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = 'https://bfozyiabmrdayqrbnsri.supabase.co'
const supabaseServiceKey = 'sb_secret_M9Ril_WIy3NogbhJMckHtg_FC_S2L4g'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const valencias = [
  'Jogador de força, com boa ruptura',
  'Atleta com ótimo jogo aéreo',
  'Jogador rápido, com capacidade de pressionar defensores',
]

async function populateSupabase() {
  try {
    console.log('📊 Iniciando população de dados no Supabase...')

    // 1. Criar usuário de teste
    console.log('👤 Criando usuário de teste...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'fabiano@scout.com',
      password: 'Fabiano@Scout123!',
      email_confirm: true,
    })

    let userId = authData?.user?.id
    
    if (authError && authError.code === 'email_exists') {
      console.log('ℹ️ Usuário já existe, buscando...')
      // Buscar o usuário existente
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find(u => u.email === 'fabiano@scout.com')
      userId = existingUser?.id
      console.log('✅ Usuário encontrado:', userId)
    } else if (authError) {
      console.error('❌ Erro ao criar usuário:', authError)
      process.exit(1)
    } else if (authData?.user) {
      console.log('✅ Usuário criado:', authData.user.id)
    }
    
    if (!userId) {
      console.error('❌ Não foi possível obter o ID do usuário')
      process.exit(1)
    }

    // 2. Ler dados dos atletas
    console.log('📖 Lendo dados dos atletas...')
    const atletasPath = './scripts/atletas-data.json'
    
    let atletas = []
    if (fs.existsSync(atletasPath)) {
      const data = fs.readFileSync(atletasPath, 'utf-8')
      atletas = JSON.parse(data)
      console.log(`✅ ${atletas.length} atletas carregados`)
    } else {
      console.log('⚠️ Arquivo de atletas não encontrado')
      process.exit(1)
    }

    // 3. Inserir atletas
    console.log('🔄 Inserindo atletas no Supabase...')
    
    const atletasFormatados = atletas.map((a) => ({
      user_id: userId,
      nome: a.nome,
      posicao: a.posicao,
      segunda_posicao: a.segunda_posicao,
      clube: a.clube,
      data_nascimento: a.data_nascimento,
      idade: a.idade,
      altura: a.altura,
      pe: a.pe,
      valencia: valencias[Math.floor(Math.random() * valencias.length)],
      ogol_id: a.ogol_id,
    }))

    // Inserir em lotes de 50
    for (let i = 0; i < atletasFormatados.length; i += 50) {
      const lote = atletasFormatados.slice(i, i + 50)
      const { error } = await supabase
        .from('atletas')
        .insert(lote)

      if (error) {
        console.error(`❌ Erro ao inserir lote ${i / 50 + 1}:`, error)
      } else {
        console.log(`✅ Lote ${i / 50 + 1} inserido (${lote.length} atletas)`)
      }
    }

    console.log(`✅ ${atletasFormatados.length} atletas inseridos no Supabase!`)
    console.log('🎉 População concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

populateSupabase()
