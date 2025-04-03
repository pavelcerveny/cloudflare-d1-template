"use server";

import { createServerAction, ZSAError } from "zsa";

import { signInSchema } from "@/schemas/signin.schema";
import { RATE_LIMITS, withRateLimit } from "@/utils/with-rate-limit";
import { signIn } from "@/auth";

export const signInAction = createServerAction()
  .input(signInSchema)
  .handler(async ({ input }) => {
    return withRateLimit(
      async () => {
        try {
          await signIn("credentials", {
            ...input,
            flow: "signin",
            redirect: false
          });

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
      RATE_LIMITS.SIGN_IN
    );
  });

