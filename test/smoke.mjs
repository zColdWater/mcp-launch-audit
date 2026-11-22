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

async function waitForCount(n, timeoutMs = 15000) {
  const start = Date.now();
  while (lines.length < n) {
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${n} responses (got ${lines.length})`);
    await new Promise((r) => setTimeout(r, 30));
  }
}

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "smoke", version: "1.0" } } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
send({ jsonrpc: "2.0", id: 3, method: "prompts/list" });
send({ jsonrpc: "2.0", id: 4, method: "resources/list" });
send({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "audit_email_deliverability", arguments: { domain: "resend.com" } } });

await waitForCount(5);
child.kill();

assert.equal(lines[0].id, 1);
assert.equal(lines[0].result.serverInfo.name, "mcp-launch-audit");
assert.equal(lines[1].id, 2);
assert.equal(lines[1].result.tools.length, 4);
assert.equal(lines[2].id, 3);
assert.equal(lines[2].result.prompts.length, 2);
assert.equal(lines[3].id, 4);
assert.equal(lines[3].result.resources.length, 1);
assert.equal(lines[4].id, 5);
assert.equal(lines[4].result.isError, false);
assert.ok(lines[4].result.structuredContent.score >= 0);

console.log("SMOKE_OK:", {
  protocol: lines[0].result.protocolVersion,
  tools: lines[1].result.tools.map((t) => t.name),
  sampleScore: lines[4].result.structuredContent.score,
});
