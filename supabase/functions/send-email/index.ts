// Resend Email Edge Function
// Deploy with: supabase functions deploy send-email
// Required secrets: RESEND_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  customerName: string;
  dealershipName: string;
  rvInfo: string;
  totalEstimate: number;
  approvalLink: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, customerName, dealershipName, rvInfo, totalEstimate, approvalLink }: EmailRequest = await req.json();

    if (!to || !subject || !approvalLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format currency
    const formattedTotal = `$${totalEstimate.toFixed(2)}`;

    // Generate HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Estimate</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2563eb;">
    <h1 style="color: #1e40af; margin: 0; font-size: 24px;">${dealershipName}</h1>
  </div>

  <div style="padding: 30px 0;">
    <p style="font-size: 16px;">Hi ${customerName},</p>

    <p style="font-size: 16px;">Your service estimate is ready for review.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Vehicle</p>
      <p style="margin: 0; font-weight: 600; font-size: 16px;">${rvInfo}</p>

      <p style="margin: 20px 0 10px 0; color: #6b7280; font-size: 14px;">Estimated Total</p>
      <p style="margin: 0; font-weight: 700; font-size: 24px; color: #2563eb;">${formattedTotal}</p>
    </div>

    <p style="font-size: 16px;">Please review the full estimate and let us know if you'd like to proceed.</p>

    <div style="text-align: center; padding: 20px 0;">
      <a href="${approvalLink}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View & Approve Estimate</a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">This link will expire in 7 days. If you have any questions, please don't hesitate to contact us.</p>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">${dealershipName}</p>
    <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated message. Please do not reply directly to this email.</p>
  </div>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
${dealershipName}

Hi ${customerName},

Your service estimate is ready for review.

Vehicle: ${rvInfo}
Estimated Total: ${formattedTotal}

Please review the full estimate and let us know if you'd like to proceed.

View & Approve: ${approvalLink}

This link will expire in 7 days.

${dealershipName}
    `.trim();

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${dealershipName} <noreply@${Deno.env.get('RESEND_DOMAIN') || 'resend.dev'}>`,
        to: [to],
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return new Response(
        JSON.stringify({ error: result.message || 'Email send failed' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
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
