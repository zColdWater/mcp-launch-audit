#!/usr/bin/env node
import readline from "node:readline";
import { dispatchJsonRpcMessage, SERVER_INFO } from "../src/mcp-core.mjs";

const args = process.argv.slice(2);
if (args.includes("--version") || args.includes("-v")) {
  process.stdout.write(`${SERVER_INFO.version}\n`);
  process.exit(0);
}
if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(
    [
      `${SERVER_INFO.name} v${SERVER_INFO.version}`,
      "Zero-dependency Model Context Protocol (MCP) server for pre-launch brand, email deliverability (SPF/DKIM/DMARC/DNSBL), and AI search (GEO / llms.txt) audits.",
      "",
      "Usage:",
      "  npx github:zColdWater/mcp-launch-audit",
      "",
      "Transport: newline-delimited JSON-RPC 2.0 over stdio",
    ].join("\n") + "\n"
  );
  process.exit(0);
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
  terminal: false,
});

rl.on("line", async (rawLine) => {
  const line = rawLine.trim();
  if (!line) return;
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    process.stdout.write(
      JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n"
    );
    return;
  }

  if (Array.isArray(parsed)) {
    const responses = (await Promise.all(parsed.map((item) => dispatchJsonRpcMessage(item)))).filter(Boolean);
    if (responses.length > 0) {
      process.stdout.write(JSON.stringify(responses) + "\n");
    }
    return;
  }

  const reply = await dispatchJsonRpcMessage(parsed);
  if (reply !== null) {
    process.stdout.write(JSON.stringify(reply) + "\n");
  }
});
