// Generated by Wrangler by running `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts`

interface CloudflareEnv {
	NEXT_CACHE_WORKERS_KV: KVNamespace;
	EMAIL_FROM: "info@cloudflare-d1-template.com";
	EMAIL_FROM_NAME: "Cloudflare D1 Template";
	EMAIL_REPLY_TO: "info@cloudflare-d1-template.com";
	NEXT_CACHE_D1: D1Database;
	NEXT_CACHE_REVALIDATION_WORKER: Fetcher;
	ASSETS: Fetcher;
}
