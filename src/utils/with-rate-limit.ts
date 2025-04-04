import "server-only";
import { checkRateLimit } from "./rate-limit";
import { getIP } from "./get-IP";
import isProd from "./is-prod";
import { HOUR_IN_SECONDS, MINUTE_IN_SECONDS } from "@/time-constants";

interface RateLimitConfig {
  identifier: string;
  limit: number;
  windowInSeconds: number;
}

export async function withRateLimit<T>(
  action: () => Promise<T>,
  config: RateLimitConfig
): Promise<T> {

  if (!isProd) {
    return action();
  }

  const ip = await getIP();

  const rateLimitResult = await checkRateLimit({
    key: ip || "",
    options: {
      identifier: config.identifier,
      limit: config.limit,
      windowInSeconds: config.windowInSeconds,
    },
  });

  if (!rateLimitResult.success) {
    throw new Error(
      `Rate limit exceeded. Try again in ${Math.ceil(
        (rateLimitResult.reset - Date.now() / 1000) / 60
      )} minutes.`
    );
  }

  return action();
}

// Common rate limit configurations
export const RATE_LIMITS = {
  SIGN_IN: {
    identifier: "sign-in",
    limit: 15,
    windowInSeconds: Math.floor(HOUR_IN_SECONDS),
  },
  GOOGLE_SSO_REQUEST: {
    identifier: "google-sso-request",
    limit: 15,
    windowInSeconds: Math.floor(HOUR_IN_SECONDS),
  },
  GOOGLE_SSO_CALLBACK: {
    identifier: "google-sso-callback",
    limit: 15,
    windowInSeconds: Math.floor(HOUR_IN_SECONDS),
  },
  SIGN_UP: {
    identifier: "sign-up",
    limit: 3,
    windowInSeconds: Math.floor(HOUR_IN_SECONDS),
  },
  SIGN_OUT: {
    identifier: "sign-out",
    limit: 5,
    windowInSeconds: Math.floor(10 * MINUTE_IN_SECONDS),
  },
  RESET_PASSWORD: {
    identifier: "auth",
    limit: 7,
    windowInSeconds: Math.floor(HOUR_IN_SECONDS),
  },
  DELETE_SESSION: {
    identifier: "delete-session",
    limit: 10,
    windowInSeconds: Math.floor(10 * MINUTE_IN_SECONDS),
  },
  EMAIL: {
    identifier: "email",
    limit: 10,
    windowInSeconds: Math.floor(HOUR_IN_SECONDS),
  },
  FORGOT_PASSWORD: {
    identifier: "forgot-password",
    limit: 4,
    windowInSeconds: Math.floor(HOUR_IN_SECONDS),
  },
  SETTINGS: {
    identifier: "settings",
    limit: 15,
    windowInSeconds: Math.floor(5 * MINUTE_IN_SECONDS),
  },
  PURCHASE: {
    identifier: "purchase",
    limit: 25,
    windowInSeconds: Math.floor(5 * MINUTE_IN_SECONDS),
  },
} as const;
