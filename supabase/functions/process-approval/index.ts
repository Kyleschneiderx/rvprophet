// Process Customer Approval Edge Function
// Deploy with: supabase functions deploy process-approval

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
    const { token, action, notes } = await req.json();

    if (!token || !action || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find work order by token
    const { data: workOrder, error: woError } = await supabaseAdmin
      .from('work_orders')
      .select('id, status, dealership_id, technician_id, approval_token_expires_at')
      .eq('approval_token', token)
      .single();

    if (woError || !workOrder) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired approval link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(workOrder.approval_token_expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Approval link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already processed
    if (workOrder.status === 'customer_approved' || workOrder.status === 'customer_rejected') {
      return new Response(
        JSON.stringify({ error: 'This work order has already been processed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request metadata for logging
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Update work order status
    const newStatus = action === 'approve' ? 'customer_approved' : 'customer_rejected';
    const { error: updateError } = await supabaseAdmin
      .from('work_orders')
      .update({
        status: newStatus,
        customer_notes: notes || null,
        ...(action === 'approve' ? { approved_at: new Date().toISOString() } : { rejected_at: new Date().toISOString() }),
      })
      .eq('id', workOrder.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to process approval' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the approval action
    await supabaseAdmin
      .from('customer_approval_logs')
      .insert({
        work_order_id: workOrder.id,
        action: action === 'approve' ? 'approved' : 'rejected',
        ip_address: ipAddress,
        user_agent: userAgent,
        notes: notes || null,
      });

    // Note: Notifications are created automatically by the database trigger
    // when the work order status changes

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
