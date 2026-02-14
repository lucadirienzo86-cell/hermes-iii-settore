import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Ottieni il token dall'header Authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Crea client Supabase con il token dell'utente
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verifica che l'utente chiamante sia autenticato
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Unauthorized')
    }

    console.log('Authenticated user:', user.id)

    // Verifica che l'utente chiamante sia admin
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      throw new Error('Error checking permissions')
    }

    const isAdmin = roles?.some(r => r.role === 'admin')
    if (!isAdmin) {
      console.error('User is not admin:', user.id)
      throw new Error('Forbidden: Only admins can delete users')
    }

    console.log('User is admin, proceeding with deletion')

    // Ottieni l'ID dell'utente da eliminare dal body
    const { userId } = await req.json()
    if (!userId) {
      throw new Error('Missing userId parameter')
    }

    console.log('Deleting user:', userId)

    // Verifica che l'utente da eliminare non sia l'admin principale
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching target profile:', profileError)
      throw new Error('User not found')
    }

    if (targetProfile.email === 'paolo.baldassare@gmail.com') {
      console.error('Attempted to delete main admin')
      throw new Error('Cannot delete the main administrator account')
    }

    console.log('Target user email:', targetProfile.email)

    // Crea client admin con Service Role Key
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Elimina l'utente dall'auth (questo triggera il CASCADE su profiles e tutto il resto)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      throw new Error(`Failed to delete user: ${deleteError.message}`)
    }

    console.log('User deleted successfully:', userId)

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in delete-user function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isForbidden = errorMessage === 'Forbidden: Only admins can delete users'
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: isForbidden ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
