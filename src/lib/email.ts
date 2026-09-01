import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) {
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Best-effort payment-failure reminder email. If Resend is not configured
 * (no RESEND_API_KEY), this logs and returns without throwing so webhook
 * handling never fails on a missing email provider.
 */
export async function sendPaymentFailedReminder(to: string | null): Promise<void> {
  if (!to) {
    console.warn('[email] payment_failed reminder skipped: no recipient email');
    return;
  }

  const client = getResend();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY not set; would send payment reminder to ${to}`,
    );
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'OC-Selective <onboarding@resend.dev>';

  try {
    await client.emails.send({
      from,
      to,
      subject: 'Action needed: your OC-Selective payment failed',
      text: [
        'Hi,',
        '',
        'We were unable to process your latest OC-Selective payment.',
        'Your access is still active for now — please update your payment',
        'method to avoid any interruption.',
        '',
        'Manage your subscription: https://trialseed.com.au/subscription',
        '',
        'Thanks,',
        'The OC-Selective team',
      ].join('\n'),
    });
  } catch (error) {
    // Do not surface email failures to the webhook response.
    console.error('[email] failed to send payment reminder:', error);
  }
}

function resetFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'TrialSeed <onboarding@resend.dev>';
}

/**
 * Best-effort password-reset email. Missing Resend config logs the reset URL
 * instead of throwing so the request API can still return a generic success.
 */
export async function sendPasswordResetEmail(options: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY not set; password reset URL for ${options.to}: ${options.resetUrl}`,
    );
    return false;
  }

  const greetingName = options.name.trim() || 'there';

  try {
    await client.emails.send({
      from: resetFromAddress(),
      to: options.to,
      subject: 'Reset your TrialSeed password',
      text: [
        `Hi ${greetingName},`,
        '',
        'We received a request to reset the password for this TrialSeed account.',
        '',
        'Reset your password (this link expires in 1 hour):',
        options.resetUrl,
        '',
        'If you did not request this, you can ignore this email. Your password will stay the same.',
        '',
        'Thanks,',
        'The TrialSeed team',
      ].join('\n'),
    });
    return true;
  } catch (error) {
    console.error('[email] failed to send password reset:', error);
    return false;
  }
}
