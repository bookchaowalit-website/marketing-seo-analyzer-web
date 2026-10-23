import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/mcp/route";

function rpc(body: unknown) {
  return POST(new Request("http://localhost/api/mcp", { method: "POST", body: JSON.stringify(body) }));
}

describe("MCP route", () => {
  it("echoes the JSON-RPC request id and lists the real tools", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 7, method: "tools/list" })).json();
    expect(body.id).toBe(7);
    expect(body.result.tools.map((t: { name: string }) => t.name)).toEqual(["analyze_html", "get_sample"]);
  });

  it("analyze_html runs the page's checks on the given snapshot", async () => {
    const html = "<title>Short</title><h1><span>Hi</span></h1>";
    const { result } = await (await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "analyze_html", arguments: { html } } })).json();
    expect(result.score).toBe(50);
    expect(result.checks.find((c: { name: string }) => c.name === "H1 present").detail).toBe("Hi");
  });

  it("get_sample returns the starting snapshot and its 100 score", async () => {
    const { result } = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_sample" } })).json();
    expect(result.html).toContain("<title>");
    expect(result.report.score).toBe(100);
  });

  it("rejects a missing or oversized html argument", async () => {
    const missing = await (await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "analyze_html", arguments: {} } })).json();
    expect(missing.error.code).toBe(-32602);
    expect(missing.id).toBe(3);
    const huge = await (await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "analyze_html", arguments: { html: "x".repeat(200_001) } } })).json();
    expect(huge.error.code).toBe(-32602);
  });

  it("rejects an unknown tool (there is no crawl) and unknown methods or bad JSON", async () => {
    const crawl = await (await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "crawl_url", arguments: { url: "https://x.test" } } })).json();
    expect(crawl.result).toBeUndefined();
    expect(crawl.error.code).toBe(-32602);
    expect((await (await rpc({ jsonrpc: "2.0", id: 6, method: "nope" })).json()).error.code).toBe(-32601);
    const res = await POST(new Request("http://localhost/api/mcp", { method: "POST", body: "{" }));
    expect((await res.json()).error.code).toBe(-32700);
  });
});
