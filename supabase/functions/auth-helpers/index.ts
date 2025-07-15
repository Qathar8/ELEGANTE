import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://deno.land/x/supabase@1.0.0/mod.ts"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserRequest {
  username: string
  password: string
  role: 'super_admin' | 'admin' | 'sales_staff'
}

interface LoginRequest {
  username: string
  password: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...data } = await req.json()

    if (action === 'create_user') {
      const { username, password, role } = data as CreateUserRequest

      const hashedPassword = await bcrypt.hash(password)

      const { data: user, error } = await supabase
        .from('users')
        .insert([{ username, password: hashedPassword, role }])
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'login') {
      const { username, password } = data as LoginRequest

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle()

      if (error || !user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return new Response(JSON.stringify({ error: 'Invalid password' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'create_default_admin') {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', 'admin')
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Admin already exists'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const hashedPassword = await bcrypt.hash('admin123')

      const { error } = await supabase
        .from('users')
        .insert([{
          username: 'admin',
          password: hashedPassword,
          role: 'super_admin'
        }])

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Admin created'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Unknown action
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
