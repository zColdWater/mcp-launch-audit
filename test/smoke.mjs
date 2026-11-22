import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, "../bin/mcp-launch-audit.mjs");

const child = spawn(process.execPath, [binPath], { stdio: ["pipe", "pipe", "pipe"] });

const lines = [];
let buf = "";
child.stdout.on("data", (chunk) => {
  buf += chunk.toString("utf8");
  let idx;
  while ((idx = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (line) lines.push(JSON.parse(line));
  }
});

function send(obj) {
  child.stdin.write(JSON.stringify(obj) + "\n");
}

async function waitForCount(n, timeoutMs = 20000) {
  const start = Date.now();
  while (lines.length < n) {
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${n} responses (got ${lines.length})`);
    await new Promise((r) => setTimeout(r, 30));
  }
}

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "smoke", version: "2.0" } } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
send({ jsonrpc: "2.0", id: 3, method: "prompts/list" });
send({ jsonrpc: "2.0", id: 4, method: "resources/list" });
send({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "audit_email_deliverability", arguments: { domain: "resend.com" } } });
send({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "audit_web_app_security", arguments: { url: "https://vibe-checker.appwrite.network", mode: "fast" } } });

await waitForCount(6);
child.kill();

const byId = new Map(lines.map((m) => [m.id, m]));
assert.equal(byId.get(1).result.serverInfo.name, "mcp-launch-audit");
assert.equal(byId.get(1).result.serverInfo.version, "2.0.0");
assert.equal(byId.get(2).result.tools.length, 5);
assert.equal(byId.get(3).result.prompts.length, 3);
assert.equal(byId.get(4).result.resources.length, 1);
assert.equal(byId.get(5).result.isError, false);
assert.ok(byId.get(5).result.structuredContent.score >= 0);
assert.equal(byId.get(6).result.isError, false);
assert.equal(byId.get(6).result.structuredContent.engineVersion, "7.0.0");
assert.equal(byId.get(6).result.structuredContent.tls.weakProtocol, false);

console.log("SMOKE_OK:", {
  protocol: byId.get(1).result.protocolVersion,
  version: byId.get(1).result.serverInfo.version,
  tools: byId.get(2).result.tools.map((t) => t.name),
  emailScore: byId.get(5).result.structuredContent.score,
  vibeScore: byId.get(6).result.structuredContent.score,
});
