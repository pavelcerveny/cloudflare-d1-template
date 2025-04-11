
import { users } from "@/db/schema";
import { init } from "@paralleldrive/cuid2";
import { encodeHexLowerCase } from "@oslojs/encoding"
import { sha256 } from "@oslojs/crypto/sha2"
import { getDB } from "@/db";
import { eq } from "drizzle-orm";
import isProd from "@/utils/is-prod";

import { ZSAError } from "zsa";
import { Session, User } from "next-auth";

const createId = init({
  length: 32,
});

export function generateSessionToken(): string {
  return createId();
}

export interface CurrentSession extends Session {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    emailVerified?: boolean
  },  
  expires: string
}

/**
 * Helper function to require a verified email for protected actions
 * @throws {ZSAError} If user is not authenticated or email is not verified
 * @returns The verified session
 */
export async function requireVerifiedEmail(session: CurrentSession) {

  if (!session) {
    throw new ZSAError("NOT_AUTHORIZED", "Not authenticated");
  }

  if (!session.user?.emailVerified) {
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
