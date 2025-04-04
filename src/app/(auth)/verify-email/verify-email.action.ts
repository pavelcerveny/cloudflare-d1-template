"use server";

import { createServerAction, ZSAError } from "zsa";

import { RATE_LIMITS, withRateLimit } from "@/utils/with-rate-limit";
import { verifyEmailSchema } from "@/schemas/verify-email.schema";
import { getDB } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isBefore } from "date-fns";

export const verifyEmailAction = createServerAction()
  .input(verifyEmailSchema)
  .handler(async ({ input }) => {
    return withRateLimit(
      async () => {
        try {
          const db = await getDB();
          
          const { token, email } = input;

          const user = await db.query.users.findFirst({
            where: eq(users.email, email)
          });

          if (!user) {
            throw new ZSAError(
              "INPUT_PARSE_ERROR",
              "Invalid email address"
            );
          }

          const verificationToken = await db.query.verificationTokens.findFirst({
            where: eq(verificationTokens.token, token)
          });

          if (!verificationToken) {
            throw new ZSAError(
              "INPUT_PARSE_ERROR",
              "Invalid verification token"
            );
          }

          if (isBefore(verificationToken.expires, new Date())) {
            throw new ZSAError(
              "INPUT_PARSE_ERROR",
              "Expired verification token"
            );
          }

          await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

          await db.update(users).set({
            emailVerified: new Date()
          }).where(eq(users.id, user.id));

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
      RATE_LIMITS.EMAIL
    );
  });

