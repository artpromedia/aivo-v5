import { Resend } from "resend";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.NOTIFICATION_FROM_EMAIL ?? "AIVO Notifications <notify@aivo.local>";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmailNotification(payload: EmailPayload) {
  if (!payload.to) {
    throw new Error("Email recipient missing");
  }

  if (!resend) {
    console.info("[notifications] Mock email delivery", {
      to: payload.to,
      subject: payload.subject,
      text: payload.text
    });
    return { id: `mock-${Date.now()}`, delivered: false };
  }

  const response = await resend.emails.send({
    from: fromAddress,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return { id: response.data?.id ?? `queued-${Date.now()}`, delivered: true };
}
