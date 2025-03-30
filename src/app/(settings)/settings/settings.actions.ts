"use server";

import { createServerAction, ZSAError } from "zsa";
import { getDB } from "@/db";
import { users } from "@/db/schema";
import { requireVerifiedEmail } from "@/utils/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { userSettingsSchema } from "@/schemas/settings.schema";
import { updateAllSessionsOfUser } from "@/utils/kv-session";
import { withRateLimit, RATE_LIMITS } from "@/utils/with-rate-limit";

export const updateUserProfileAction = createServerAction()
  .input(userSettingsSchema)
  .handler(async ({ input }) => {
    return withRateLimit(
      async () => {
        const session = await requireVerifiedEmail();
        const db = await getDB();

        try {
          // await db.update(users)
          //   .set({
          //     ...input,
          //   })
          //   .where(eq(users.id, session.user.id));

          await updateAllSessionsOfUser(session.user.id)

          revalidatePath("/settings");
          return { success: true };
        } catch (error) {
          console.error(error)
          throw new ZSAError(
            "INTERNAL_SERVER_ERROR",
            "Failed to update profile"
          );
        }
      },
      RATE_LIMITS.SETTINGS
    );
  });
