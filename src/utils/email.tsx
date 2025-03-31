import "server-only";

import { SITE_DOMAIN, SITE_URL } from "@/constants";
import { render } from '@react-email/render'
import { ResetPasswordEmail } from "@/react-email/reset-password";
import { VerifyEmail } from "@/react-email/verify-email";
import isProd from "./is-prod";
import nodemailer from 'nodemailer';

interface BrevoEmailOptions {
  to: { email: string; name?: string }[];
  subject: string;
  replyTo?: string;
  htmlContent: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, string>;
  tags?: string[];
}

interface ResendEmailOptions {
  to: string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  text?: string;
  tags?: { name: string; value: string }[];
}

interface NodemailerEmailOptions {
  to: { email: string; name?: string }[];
  subject: string;
  replyTo?: string;
  htmlContent: string;
  textContent?: string;
  params?: Record<string, string>;
  tags?: string[];
}

type EmailProvider = "resend" | "brevo" | "nodemailer" | null;

async function getEmailProvider(): Promise<EmailProvider> {
  if (process.env.RESEND_API_KEY) {
    return "resend";
  }

  if (process.env.BREVO_API_KEY) {
    return "brevo";
  }
  
  if (process.env.NODEMAILER_HOST && process.env.NODEMAILER_USER && process.env.NODEMAILER_PASS) {
    return "nodemailer";
  }

  return null;
}

async function sendResendEmail({
  to,
  subject,
  html,
  from,
  replyTo: originalReplyTo,
  text,
  tags,
}: ResendEmailOptions) {
  if (!isProd) {
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const replyTo = originalReplyTo ?? process.env.EMAIL_REPLY_TO;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    } as const,
    body: JSON.stringify({
      from: from ?? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      tags,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send email via Resend: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function sendBrevoEmail({
  to,
  subject,
  replyTo: originalReplyTo,
  htmlContent,
  textContent,
  templateId,
  params,
  tags,
}: BrevoEmailOptions) {
  if (!isProd) {
    return;
  }

  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not set");
  }

  const replyTo = originalReplyTo ?? process.env.EMAIL_REPLY_TO;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    } as const,
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_FROM_NAME,
        email: process.env.EMAIL_FROM,
      },
      to,
      htmlContent,
      textContent,
      subject,
      templateId,
      params,
      tags,
      ...(replyTo ? { replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send email via Brevo: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function sendNodemailerEmail({
  to,
  subject,
  replyTo: originalReplyTo,
  htmlContent,
  textContent,
  params,
  tags,
}: NodemailerEmailOptions) {
  if (!isProd) {
    return;
  }

  if (!process.env.NODEMAILER_HOST || !process.env.NODEMAILER_USER || !process.env.NODEMAILER_PASS) {
    throw new Error("Nodemailer configuration is not complete. Please check NODEMAILER_HOST, NODEMAILER_USER, and NODEMAILER_PASS environment variables.");
  }

  const replyTo = originalReplyTo ?? process.env.EMAIL_REPLY_TO;

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT ? parseInt(process.env.NODEMAILER_PORT) : 587,
    secure: process.env.NODEMAILER_SECURE === 'true',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });

  // Prepare recipients
  const recipients = to.map(recipient => {
    if (recipient.name) {
      return `"${recipient.name}" <${recipient.email}>`;
    }
    return recipient.email;
  });

  // Build email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: recipients.join(', '),
    subject,
    html: htmlContent,
    ...(textContent ? { text: textContent } : {}),
    ...(replyTo ? { replyTo } : {}),
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    return {
      id: info.messageId,
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to send email via Nodemailer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function sendPasswordResetEmail({
  email,
  resetToken,
  username
}: {
  email: string;
  resetToken: string;
  username: string;
}) {
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;

  if (!isProd) {
    console.warn('\n\n\nPassword reset url: ', resetUrl)

    return
  }

  const html = await render(ResetPasswordEmail({ resetLink: resetUrl, username }));
  const provider = await getEmailProvider();

  if (!provider && isProd) {
    throw new Error("No email provider configured. Set either RESEND_API_KEY or BREVO_API_KEY in your environment.");
  }

  if (provider === "resend") {
    await sendResendEmail({
      to: [email],
      subject: `Reset your password for ${SITE_DOMAIN}`,
      html,
      tags: [{ name: "type", value: "password-reset" }],
    });
  } else if (provider === "brevo") {
    await sendBrevoEmail({
      to: [{ email, name: username }],
      subject: `Reset your password for ${SITE_DOMAIN}`,
      htmlContent: html,
      tags: ["password-reset"],
    });
  } else if (provider === "nodemailer") {
    await sendNodemailerEmail({
      to: [{ email, name: username }],
      subject: `Reset your password for ${SITE_DOMAIN}`,
      htmlContent: html,
      tags: ["password-reset"],
    });
  }
}

export async function sendVerificationEmail({
  email,
  verificationToken,
  username
}: {
  email: string;
  verificationToken: string;
  username: string;
}) {
  const verificationUrl = `${SITE_URL}/verify-email?token=${verificationToken}`;

  if (!isProd) {
    console.warn('\n\n\nVerification url: ', verificationUrl)

    return
  }

  const html = await render(VerifyEmail({ verificationLink: verificationUrl, username }));
  const provider = await getEmailProvider();

  if (!provider && isProd) {
    throw new Error("No email provider configured. Set either RESEND_API_KEY or BREVO_API_KEY in your environment.");
  }

  if (provider === "resend") {
    await sendResendEmail({
      to: [email],
      subject: `Verify your email for ${SITE_DOMAIN}`,
      html,
      tags: [{ name: "type", value: "email-verification" }],
    });
  } else if (provider === "brevo") {
    await sendBrevoEmail({
      to: [{ email, name: username }],
      subject: `Verify your email for ${SITE_DOMAIN}`,
      htmlContent: html,
      tags: ["email-verification"],
    });
  } else if (provider === "nodemailer") {
    await sendNodemailerEmail({
      to: [{ email, name: username }],
      subject: `Verify your email for ${SITE_DOMAIN}`,
      htmlContent: html,
      tags: ["email-verification"],
    });
  }
}
