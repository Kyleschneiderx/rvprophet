// Create Dealership Owner Edge Function
// Deploy with: supabase functions deploy create-dealership-owner --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dealershipName, ownerName, email, password } = await req.json();

    console.log('Creating dealership:', dealershipName, 'for owner:', email);

    // Validate required fields
    if (!dealershipName || !ownerName || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: dealershipName, ownerName, email, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 1: Create the dealership
    console.log('Creating dealership...');
    const { data: dealership, error: dealershipError } = await supabaseAdmin
      .from('dealerships')
      .insert({
        name: dealershipName,
        default_labor_rate: 85,
        currency_symbol: '$',
        parts_markup_percent: 0,
        technicians_see_pricing: false,
      })
      .select('id')
      .single();

    if (dealershipError) {
      console.error('Dealership create error:', dealershipError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to create dealership: ' + dealershipError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Dealership created:', dealership.id);

    // Step 2: Create the auth user
    console.log('Creating auth user...');
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createAuthError) {
      console.error('Create auth error:', createAuthError.message);
      // Rollback: delete dealership
      await supabaseAdmin.from('dealerships').delete().eq('id', dealership.id);
      console.log('Rolled back dealership creation');

      return new Response(
        JSON.stringify({ error: 'Failed to create user: ' + createAuthError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      // Rollback: delete dealership
      await supabaseAdmin.from('dealerships').delete().eq('id', dealership.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create user - no user returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Step 3: Create the profile
    console.log('Creating profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        dealership_id: dealership.id,
        name: ownerName,
        email,
        role: 'owner',
        status: 'active',
      })
      .select('id, name, email, role, status')
      .single();

    if (profileError) {
      console.error('Profile create error:', profileError.message);
      // Rollback: delete auth user and dealership
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('dealerships').delete().eq('id', dealership.id);
      console.log('Rolled back auth user and dealership creation');

      return new Response(
        JSON.stringify({ error: 'Failed to create profile: ' + profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile created:', profile.id);
    console.log('Dealership owner signup complete');

    return new Response(
      JSON.stringify({
        success: true,
        dealershipId: dealership.id,
        user: profile,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
