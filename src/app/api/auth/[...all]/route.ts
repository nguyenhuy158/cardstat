import { getCloudflareContext } from "@opennextjs/cloudflare";

import { createAuth, type AuthEnv } from "@/infrastructure/auth/auth";

async function handler(req: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const auth = createAuth(env as AuthEnv, req.url);
  return auth.handler(req);
}

export const GET = handler;
export const POST = handler;
