import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
 
export const env = createEnv({

  server: {
    AUTH_SECRET: z.string().min(16),

    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_API_TOKEN: z.string(),

    TURNSTILE_SECRET_KEY: z.string().optional(),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    STRIPE_SECRET_KEY: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
    BREVO_API_KEY: z.string().optional(),

    NODEMAILER_HOST: z.string().optional(),
    NODEMAILER_PORT: z.string().optional(),
    NODEMAILER_USER: z.string().optional(),
    NODEMAILER_PASS: z.string().optional(),

    EMAIL_FROM: z.string().optional(),
    EMAIL_FROM_NAME: z.string().optional(),
    EMAIL_REPLY_TO: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  },

  runtimeEnv: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    AUTH_SECRET: process.env.AUTH_SECRET,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    NODEMAILER_HOST: process.env.NODEMAILER_HOST,
    NODEMAILER_PORT: process.env.NODEMAILER_PORT,
    NODEMAILER_USER: process.env.NODEMAILER_USER,
    NODEMAILER_PASS: process.env.NODEMAILER_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  },

  emptyStringAsUndefined: true,
});