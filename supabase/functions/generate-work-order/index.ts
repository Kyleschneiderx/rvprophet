// Follow Deno Edge Function conventions
// Deploy with: supabase functions deploy generate-work-order

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
    const { workOrderId, deliveryMethod } = await req.json();

    if (!workOrderId || !deliveryMethod) {
      return new Response(
        JSON.stringify({ error: 'Missing workOrderId or deliveryMethod' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get work order with related data
    const { data: workOrder, error: woError } = await supabaseAdmin
      .from('work_orders')
      .select(`
        *,
        customers (id, name, email, phone),
        rvs (id, year, make, model, nickname),
        dealerships (id, name, phone, email)
      `)
      .eq('id', workOrderId)
      .single();

    if (woError || !workOrder) {
      return new Response(
        JSON.stringify({ error: 'Work order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate approval token
    const approvalToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Update work order with approval token and status
    const { error: updateError } = await supabaseAdmin
      .from('work_orders')
      .update({
        approval_token: approvalToken,
        approval_token_expires_at: expiresAt.toISOString(),
        status: 'pending_customer_approval',
      })
      .eq('id', workOrderId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update work order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate approval link
    const baseUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
    const approvalLink = `${baseUrl}/approve/${approvalToken}`;

    // Log the send action
    await supabaseAdmin
      .from('customer_approval_logs')
      .insert({
        work_order_id: workOrderId,
        action: 'sent',
        delivery_method: deliveryMethod,
      });

    // Call the appropriate send function
    if (deliveryMethod === 'sms') {
      const smsResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            to: workOrder.customers.phone,
            message: `Your RV service estimate from ${workOrder.dealerships.name} is ready. Review and approve here: ${approvalLink}`,
          }),
        }
      );

      if (!smsResponse.ok) {
        console.error('SMS send failed:', await smsResponse.text());
      }
    } else if (deliveryMethod === 'email') {
      const emailResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            to: workOrder.customers.email,
            subject: `Service Estimate Ready - ${workOrder.dealerships.name}`,
            customerName: workOrder.customers.name,
            dealershipName: workOrder.dealerships.name,
            rvInfo: `${workOrder.rvs.year} ${workOrder.rvs.make} ${workOrder.rvs.model}`,
            totalEstimate: workOrder.total_estimate,
            approvalLink,
          }),
        }
      );

      if (!emailResponse.ok) {
        console.error('Email send failed:', await emailResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, approvalToken }),
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
