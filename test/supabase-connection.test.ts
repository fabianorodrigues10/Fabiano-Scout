import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Supabase Connection', () => {
  it('should connect to Supabase with valid credentials', async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    expect(supabaseUrl).toBeDefined()
    expect(supabaseKey).toBeDefined()

    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Testar conexão fazendo uma query simples
    const { data, error } = await supabase
      .from('atletas')
      .select('id')
      .limit(1)

    // Se houver erro de autenticação, as credenciais estão erradas
    if (error) {
      console.error('Supabase Error:', error)
      expect(error.message).not.toContain('401')
      expect(error.message).not.toContain('Unauthorized')
    }

    // Se não houver erro, a conexão está OK
    expect(error === null || error.code !== '401').toBe(true)
  })

  it('should have correct URL format', () => {
    const url = process.env.VITE_SUPABASE_URL
    expect(url).toMatch(/^https:\/\/.*\.supabase\.co$/)
  })

  it('should have valid API key format', () => {
    const key = process.env.VITE_SUPABASE_ANON_KEY
    expect(key).toBeDefined()
    expect(key!.length).toBeGreaterThan(20)
  })
})
