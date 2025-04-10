"use server";

import { createServerAction, ZSAError } from "zsa";
import { getDB } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { sendPasswordResetEmail } from "@/utils/email";
import { eq } from "drizzle-orm";
import { validateCaptcha } from "@/utils/validate-captcha";
import { forgotPasswordSchema } from "@/schemas/forgot-password.schema";
import { withRateLimit, RATE_LIMITS } from "@/utils/with-rate-limit";
import { PASSWORD_RESET_TOKEN_EXPIRATION_SECONDS } from "@/constants";
import { CAPTCHA_ENABLED } from "@/featureFlags";

export const forgotPasswordAction = createServerAction()
  .input(forgotPasswordSchema)
  .handler(async ({ input }) => {
    return withRateLimit(
      async () => {
        if (CAPTCHA_ENABLED && input.captchaToken) {
          const success = await validateCaptcha(input.captchaToken)

          if (!success) {
            throw new ZSAError(
              "INPUT_PARSE_ERROR",
              "Please complete the captcha"
            )
          }
        }

        const db = await getDB();

        try {
          // Find user by email
          const user = await db.query.users.findFirst({
            where: eq(users.email, input.email.toLowerCase()),
          });

          // Even if user is not found, return success to prevent email enumeration
          if (!user) {
            return { success: true };
          }

          // Generate reset token
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_SECONDS * 1000);
  
        await db.insert(verificationTokens)
          .values({
            identifier: crypto.randomUUID(),
            token: resetToken,
            expires: expiresAt,
          });
          
          // Send reset email
          if (user?.email) {
            await sendPasswordResetEmail({
              email: user.email,
              resetToken,
              username: user.firstName ?? user.email,
            });
          }

          return { success: true };
        } catch (error) {
          console.error(error)

          if (error instanceof ZSAError) {
            throw error;
          }

          throw new ZSAError(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred"
          );
        }
      },
      RATE_LIMITS.FORGOT_PASSWORD
    );
  });