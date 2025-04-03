import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
 
export const env = createEnv({
  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string(),
  },

  runtimeEnv: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  }
});