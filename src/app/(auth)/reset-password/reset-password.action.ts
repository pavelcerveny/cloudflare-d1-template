"use server";

import { createServerAction, ZSAError } from "zsa";
import { getDB } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { resetPasswordSchema } from "@/schemas/reset-password.schema";
import { hashPassword } from "@/utils/password-hasher";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import { withRateLimit, RATE_LIMITS } from "@/utils/with-rate-limit";

export const resetPasswordAction = createServerAction()
  .input(resetPasswordSchema)
  .handler(async ({ input }) => {
    return withRateLimit(
      async () => {
        const db = await getDB();

        const { token } = input;

        try {
          // Hash the input token with SHA-256 to compare with stored hash
          const hashedInputToken = crypto.createHash('sha256').update(input.token).digest('hex');
          
          // Find valid reset token
          const resetToken = await db.query.passwordResetTokens.findFirst({
            where: and(
              eq(passwordResetTokens.token, hashedInputToken),
              gt(passwordResetTokens.expires, new Date())
            )
          });
          
          if (!resetToken) {
            throw new ZSAError(
              "NOT_FOUND",
              "Invalid or expired reset token"
            );
          }

          // Find user
          const user = await db.query.users.findFirst({
            where: eq(users.id, resetToken.userId),
          });

          if (!user) {
            throw new ZSAError(
              "NOT_FOUND",
              "User not found"
            );
          }

          // Update password
          const hashedPassword = await hashPassword({ password: input.password });
          await db.update(users)
            .set({ hashedPassword })
            .where(eq(users.id, resetToken.userId));

          // Delete the used token
          await db.delete(passwordResetTokens)
            .where(eq(passwordResetTokens.id, resetToken.id));

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
      RATE_LIMITS.RESET_PASSWORD
    );
  });