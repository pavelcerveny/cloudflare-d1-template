
import { users } from "@/db/schema";
import { init } from "@paralleldrive/cuid2";
import { encodeHexLowerCase } from "@oslojs/encoding"
import { sha256 } from "@oslojs/crypto/sha2"
import ms from "ms"
import { getDB } from "@/db";
import { eq } from "drizzle-orm";
import isProd from "@/utils/is-prod";
import {
  createKVSession,
  deleteKVSession,
  type KVSession,
  type CreateKVSessionParams,
  getKVSession,
  updateKVSession,
  CURRENT_SESSION_VERSION
} from "./kv-session";
import { cache } from "react"
import type { SessionValidationResult } from "@/types";
import { ZSAError } from "zsa";
import { addFreeMonthlyCreditsIfNeeded } from "./credits";
import { DAY_IN_MILLISECONDS } from "@/time-constants";

const getSessionLength = () => {
  return 30 * DAY_IN_MILLISECONDS;
}

/**
 * This file is based on https://lucia-auth.com
 */

export async function getUserFromDB(userId: string) {
  const db = await getDB();
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      // firstName: true,
      // lastName: true,
      role: true,
      emailVerified: true,
      // avatar: true,
      // createdAt: true,
      // updatedAt: true,
      currentCredits: true,
      lastCreditRefreshAt: true,
    },
  });
}

const createId = init({
  length: 32,
});

export function generateSessionToken(): string {
  return createId();
}

function encodeSessionCookie(userId: string, token: string): string {
  return `${userId}:${token}`;
}

function decodeSessionCookie(cookie: string): { userId: string; token: string } | null {
  const parts = cookie.split(':');
  if (parts.length !== 2) return null;
  return { userId: parts[0], token: parts[1] };
}

interface CreateSessionParams extends Pick<CreateKVSessionParams, "authenticationType" | "passkeyCredentialId" | "userId"> {
  token: string;
}

export async function createSession({
  token,
  userId,
  authenticationType,
  passkeyCredentialId
}: CreateSessionParams): Promise<KVSession> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const expiresAt = new Date(Date.now() + getSessionLength());

  const user = await getUserFromDB(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return createKVSession({
    sessionId,
    userId,
    expiresAt,
    user,
    authenticationType,
    passkeyCredentialId
  });
}

export async function createAndStoreSession(
  userId: string,
  authenticationType?: CreateKVSessionParams["authenticationType"],
  passkeyCredentialId?: CreateKVSessionParams["passkeyCredentialId"]
) {
  const sessionToken = generateSessionToken();
  const session = await createSession({
    token: sessionToken,
    userId,
    authenticationType,
    passkeyCredentialId
  });
  await setSessionTokenCookie({
    token: sessionToken,
    userId,
    expiresAt: new Date(session.expiresAt)
  });
}

async function validateSessionToken(token: string, userId: string): Promise<SessionValidationResult | null> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const session = await getKVSession(sessionId, userId);

  if (!session) return null;

  // If the session has expired, delete it and return null
  if (Date.now() >= session.expiresAt) {
    await deleteKVSession(sessionId, userId);
    return null;
  }

  // Check if session version needs to be updated
  if (!session.version || session.version !== CURRENT_SESSION_VERSION) {
    const updatedSession = await updateKVSession(sessionId, userId, new Date(session.expiresAt));

    if (!updatedSession) {
      return null;
    }

    return updatedSession;
  }

  // Check and refresh credits if needed
  const currentCredits = await addFreeMonthlyCreditsIfNeeded(session);

  // If credits were refreshed, update the session
  if (
    session?.user?.currentCredits &&
    currentCredits !== session.user.currentCredits
  ) {
    session.user.currentCredits = currentCredits;
  }

  // Return the user data directly from the session
  return session;
}

export async function invalidateSession(sessionId: string, userId: string): Promise<void> {
  await deleteKVSession(sessionId, userId);
}

interface SetSessionTokenCookieParams {
  token: string;
  userId: string;
  expiresAt: Date;
}

export async function setSessionTokenCookie({ token, userId, expiresAt }: SetSessionTokenCookieParams): Promise<void> {
  // const cookieStore = await cookies();
  // cookieStore.set(SESSION_COOKIE_NAME, encodeSessionCookie(userId, token), {
  //   httpOnly: true,
  //   sameSite: isProd ? "strict" : "lax",
  //   secure: isProd,
  //   expires: expiresAt,
  //   path: "/",
  // });
}

export async function deleteSessionTokenCookie(): Promise<void> {
  // const cookieStore = await cookies();
  // cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * This function can only be called in a Server Components, Server Action or Route Handler
 */
export const getSessionFromCookie = cache(async (): Promise<SessionValidationResult | null> => {
  // const cookieStore = await cookies();
  // const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // if (!sessionCookie) {
  //   return null;
  // }

  // const decoded = decodeSessionCookie(sessionCookie);

  // if (!decoded || !decoded.token || !decoded.userId) {
  //   return null;
  // }

  // return validateSessionToken(decoded.token, decoded.userId);
})

/**
 * Helper function to require a verified email for protected actions
 * @throws {ZSAError} If user is not authenticated or email is not verified
 * @returns The verified session
 */
export async function requireVerifiedEmail() {
  const session = await getSessionFromCookie();

  if (!session) {
    throw new ZSAError("NOT_AUTHORIZED", "Not authenticated");
  }

  if (!session.user.emailVerified) {
    throw new ZSAError("FORBIDDEN", "Please verify your email first");
  }

  return session;
}

interface DisposableEmailResponse {
  disposable: string;
}

interface MailcheckResponse {
  status: number;
  email: string;
  domain: string;
  mx: boolean;
  disposable: boolean;
  public_domain: boolean;
  relay_domain: boolean;
  alias: boolean;
  role_account: boolean;
  did_you_mean: string | null;
}

type ValidatorResult = {
  success: boolean;
  isDisposable: boolean;
};

/**
 * Checks if an email is disposable using debounce.io
 */
async function checkWithDebounce(email: string): Promise<ValidatorResult> {
  try {
    const response = await fetch(`https://disposable.debounce.io/?email=${encodeURIComponent(email)}`);

    if (!response.ok) {
      console.error("Debounce.io API error:", response.status);
      return { success: false, isDisposable: false };
    }

    const data = await response.json() as DisposableEmailResponse;

    return { success: true, isDisposable: data.disposable === "true" };
  } catch (error) {
    console.error("Failed to check disposable email with debounce.io:", error);
    return { success: false, isDisposable: false };
  }
}

/**
 * Checks if an email is disposable using mailcheck.ai
 */
async function checkWithMailcheck(email: string): Promise<ValidatorResult> {
  try {
    const response = await fetch(`https://api.mailcheck.ai/email/${encodeURIComponent(email)}`);

    if (!response.ok) {
      console.error("Mailcheck.ai API error:", response.status);
      return { success: false, isDisposable: false };
    }

    const data = await response.json() as MailcheckResponse;
    return { success: true, isDisposable: data.disposable };
  } catch (error) {
    console.error("Failed to check disposable email with mailcheck.ai:", error);
    return { success: false, isDisposable: false };
  }
}


/**
 * Checks if an email is allowed for sign up by verifying it's not a disposable email
 * Uses multiple services in sequence for redundancy.
 *
 * @throws {ZSAError} If email is disposable or if all services fail
 */
export async function canSignUp({ email }: { email: string }): Promise<void> {
  // Skip disposable email check in development
  if (!isProd) {
    return;
  }

  const validators = [
    checkWithDebounce,
    checkWithMailcheck,
  ];

  for (const validator of validators) {
    const result = await validator(email);

    // If the validator failed (network error, rate limit, etc), try the next one
    if (!result.success) {
      continue;
    }

    // If we got a successful response and it's disposable, reject the signup
    if (result.isDisposable) {
      throw new ZSAError(
        "PRECONDITION_FAILED",
        "Disposable email addresses are not allowed"
      );
    }

    // If we got a successful response and it's not disposable, allow the signup
    return;
  }

  // If all validators failed, we can't verify the email
  throw new ZSAError(
    "PRECONDITION_FAILED",
    "Unable to verify email address at this time. Please try again later."
  );
}
