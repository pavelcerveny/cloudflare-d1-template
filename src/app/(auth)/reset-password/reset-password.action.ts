"use server";

import { createServerAction, ZSAError } from "zsa";
import { getDB } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { resetPasswordSchema } from "@/schemas/reset-password.schema";
import { hashPassword } from "@/utils/password-hasher";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getResetTokenKey } from "@/utils/auth-utils";
import { withRateLimit, RATE_LIMITS } from "@/utils/with-rate-limit";

export const resetPasswordAction = createServerAction()
  .input(resetPasswordSchema)
  .handler(async ({ input }) => {
    return withRateLimit(
      async () => {
        const db = await getDB();

        try {
          // Find valid reset token
          const verificationToken = await db.query.verificationTokens.findFirst({
            where: eq(verificationTokens.token, token)
          });
          if (!verificationToken) {
            throw new ZSAError(
              "NOT_FOUND",
              "Invalid or expired reset token"
            );
          }

          const resetToken = JSON.parse(resetTokenStr) as {
            userId: string;
            expiresAt: string;
          };

          // Check if token is expired (although KV should have auto-deleted it)
          if (new Date() > new Date(resetToken.expiresAt)) {
            throw new ZSAError(
              "PRECONDITION_FAILED",
              "Reset token has expired"
            );
          }

          // Find user
          const user = await db.query.userTable.findFirst({
            where: eq(userTable.id, resetToken.userId),
          });

          if (!user) {
            throw new ZSAError(
              "NOT_FOUND",
              "User not found"
            );
          }

          // Update password
          const passwordHash = await hashPassword({ password: input.password });
          await db.update(userTable)
            .set({ passwordHash })
            .where(eq(userTable.id, resetToken.userId));

          // Delete the used token
          await env.NEXT_CACHE_WORKERS_KV.delete(getResetTokenKey(input.token));

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