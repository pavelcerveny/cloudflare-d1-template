import { env } from "@/env/client";

export const CAPTCHA_ENABLED = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== undefined;
