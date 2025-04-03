"use server";

import { createServerAction, ZSAError } from "zsa"
import { signUpSchema } from "@/schemas/signup.schema";
import { withRateLimit, RATE_LIMITS } from "@/utils/with-rate-limit";
import { validateTurnstileToken } from "@/utils/validate-captcha";
import { CAPTCHA_ENABLED } from "@/featureFlags";
import { signIn } from "@/auth";

export const signUpAction = createServerAction()
  .input(signUpSchema)
  .handler(async ({ input }) => {
    return withRateLimit(
      async () => {
        if (CAPTCHA_ENABLED && input.captchaToken) {
          const success = await validateTurnstileToken(input.captchaToken)

          if (!success) {
            throw new ZSAError(
              "INPUT_PARSE_ERROR",
              "Please complete the captcha"
            )
          }
        }

        await signIn("credentials", {
          ...input,
          flow: "signup",
          redirect: false
        });

        return { success: true };
      },
      RATE_LIMITS.SIGN_UP
    );
  })
