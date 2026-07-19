import { ensureUserColumns } from "@daily-puzzle/db";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

async function withSchema(
  req: Request,
  method: "GET" | "POST",
) {
  await ensureUserColumns();
  return method === "GET" ? handler.GET(req) : handler.POST(req);
}

export async function GET(req: Request) {
  return withSchema(req, "GET");
}

export async function POST(req: Request) {
  return withSchema(req, "POST");
}
