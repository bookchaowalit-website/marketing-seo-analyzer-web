import { NextResponse } from "next/server";
import { SAMPLE, inspect } from "@/lib/seo";

// Stateless JSON-RPC MCP endpoint running the same basic checks as the page on HTML the caller sends.
// It never fetches a URL: there is no crawl tool, only analysis of the snapshot in the request.

type RpcRequest = { id?: number | string | null; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };

const MAX_HTML = 200_000;

const TOOLS = [
  {
    name: "analyze_html",
    description: "Run the six basic checks (title, title length, meta description, h1, image alt, links) on an HTML snapshot",
    inputSchema: { type: "object", properties: { html: { type: "string", maxLength: MAX_HTML } }, required: ["html"] },
  },
  { name: "get_sample", description: "The sample snapshot the page starts with, and its report", inputSchema: { type: "object", properties: {} } },
];

class RpcError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

function callTool(name: string | undefined, args: Record<string, unknown> = {}) {
  switch (name) {
    case "analyze_html": {
      if (typeof args.html !== "string") throw new RpcError(-32602, "html must be a string");
      if (args.html.length > MAX_HTML) throw new RpcError(-32602, `html is longer than ${MAX_HTML} characters`);
      return inspect(args.html);
    }
    case "get_sample":
      return { html: SAMPLE, report: inspect(SAMPLE) };
    default:
      throw new RpcError(-32602, `Unknown tool: ${String(name)}`);
  }
}

export async function POST(request: Request) {
  let id: RpcRequest["id"] = null;
  try {
    const body = (await request.json()) as RpcRequest;
    id = body.id ?? null;
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "SEO Inspection Bench", version: "1.0.0" } };
        break;
      case "tools/list":
        result = { tools: TOOLS };
        break;
      case "tools/call":
        result = callTool(body.params?.name, body.params?.arguments);
        break;
      default:
        throw new RpcError(-32601, `Unknown method: ${String(body.method)}`);
    }
    return NextResponse.json({ jsonrpc: "2.0", id, result });
  } catch (error) {
    const code = error instanceof RpcError ? error.code : -32700;
    const message = error instanceof RpcError ? error.message : "Parse error";
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 400 });
  }
}
