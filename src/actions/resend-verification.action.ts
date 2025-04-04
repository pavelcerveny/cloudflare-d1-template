"use server";

import { createServerAction, ZSAError } from "zsa";
import { createId } from "@paralleldrive/cuid2";
import { sendVerificationEmail } from "@/utils/email";
import { withRateLimit, RATE_LIMITS } from "@/utils/with-rate-limit";
import { EMAIL_VERIFICATION_TOKEN_EXPIRATION_SECONDS } from "@/constants";
import { z } from "zod";
import { auth } from "@/auth";
import { getDB } from "@/db";
import { eq } from "drizzle-orm";
import { users, verificationTokens } from "@/db/schema";

export const resendVerificationAction = createServerAction()
  .input(z.void())
  .handler(async () => {
    return withRateLimit(
      async () => {
       const session = await auth();

        if (!session?.user) {
          throw new ZSAError(
            "NOT_AUTHORIZED", 
            "Not authenticated"
          );
        }

        const db = await getDB();

        const user = await db.query.users.findFirst({
          where: eq(users.email, session.user.email!)
        });

        if (user?.emailVerified) {
          throw new ZSAError(
            "PRECONDITION_FAILED",
            "Email is already verified"
          );
        }

        const verificationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRATION_SECONDS * 1000);
  
        await db.insert(verificationTokens)
          .values({
            identifier: crypto.randomUUID(),
            token: verificationToken,
            expires: expiresAt,
          });
  
        await sendVerificationEmail({
          email: session.user.email!,
          verificationToken,
          username: session.user.name || session.user.email!
        });

        return { success: true };
      },
      RATE_LIMITS.EMAIL
    );
  });

