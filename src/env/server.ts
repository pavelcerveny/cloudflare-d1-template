import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
 
export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(16),

    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_API_TOKEN: z.string(),

    TURNSTILE_SECRET_KEY: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    STRIPE_SECRET_KEY: z.string(),

    RESEND_API_KEY: z.string(),
    BREVO_API_KEY: z.string(),
  },
  
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
  },

  emptyStringAsUndefined: true,
});