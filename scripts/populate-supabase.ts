import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = 'https://bfozyiabmrdayqrbnsri.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Valências para distribuir aleatoriamente
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

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError)
      // Continuar mesmo se o usuário já existe
    } else {
      console.log('✅ Usuário criado:', authData.user?.id)
    }

    const userId = authData?.user?.id || '00000000-0000-0000-0000-000000000001'

    // 2. Ler dados dos atletas do arquivo local
    console.log('📖 Lendo dados dos atletas...')
    const atletasPath = path.join(process.cwd(), 'scripts', 'atletas-data.json')
    
    let atletas = []
    if (fs.existsSync(atletasPath)) {
      const data = fs.readFileSync(atletasPath, 'utf-8')
      atletas = JSON.parse(data)
      console.log(`✅ ${atletas.length} atletas carregados`)
    } else {
      console.log('⚠️ Arquivo de atletas não encontrado, usando dados vazios')
    }

    // 3. Inserir atletas no Supabase
    if (atletas.length > 0) {
      console.log('🔄 Inserindo atletas no Supabase...')
      
      const atletasFormatados = atletas.map((a: any) => ({
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

      // Inserir em lotes de 100
      for (let i = 0; i < atletasFormatados.length; i += 100) {
        const lote = atletasFormatados.slice(i, i + 100)
        const { error } = await supabase
          .from('atletas')
          .insert(lote)

        if (error) {
          console.error(`❌ Erro ao inserir lote ${i / 100 + 1}:`, error)
        } else {
          console.log(`✅ Lote ${i / 100 + 1} inserido (${lote.length} atletas)`)
        }
      }

      console.log(`✅ ${atletasFormatados.length} atletas inseridos no Supabase!`)
    }

    console.log('🎉 População concluída!')
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

populateSupabase()
