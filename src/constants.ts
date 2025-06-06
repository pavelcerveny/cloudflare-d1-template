import type { Route } from "next"
import { DAY_IN_SECONDS } from "./time-constants"

export const SITE_NAME = "SaaS Template"
export const SITE_DESCRIPTION = "A modern SaaS template built with Next.js 15 and Cloudflare Workers, designed for scalability and performance."
export const SITE_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "http://localhost:3000"
export const GITHUB_REPO_URL = "https://github.com/pavelcerveny/cloudflare-d1-template"

export const SITE_DOMAIN = new URL(SITE_URL).hostname
export const PASSWORD_RESET_TOKEN_EXPIRATION_SECONDS = DAY_IN_SECONDS;
export const EMAIL_VERIFICATION_TOKEN_EXPIRATION_SECONDS = DAY_IN_SECONDS;
export const SESSION_COOKIE_NAME = "session";
export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "google-oauth-state";
export const GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME = "google-oauth-code-verifier";

export const CREDIT_PACKAGES = [
  { id: "package-1", credits: 500, price: 5 },
  { id: "package-2", credits: 1200, price: 10 },
  { id: "package-3", credits: 3000, price: 20 },
] as const;

export const CREDITS_EXPIRATION_YEARS = 2;

export const FREE_MONTHLY_CREDITS = CREDIT_PACKAGES[0].credits * 0.1;
export const MAX_TRANSACTIONS_PER_PAGE = 10;
export const REDIRECT_AFTER_SIGN_IN = "/dashboard" as Route;
export const REDIRECT_TO_LOGIN = "/login" as Route;
export const SIGNIN_ERROR_URL = "/error";
