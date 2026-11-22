# mcp-launch-audit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-success.svg)](./package.json)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--03--26%20%7C%202024--11--05-7c3aed.svg)](https://modelcontextprotocol.io)
[![BrandShield](https://brand-checker.appwrite.network/badge/brand/BrandShieldCLI.svg)](https://brand-checker.appwrite.network/report/BrandShieldCLI)
[![Email Security](https://inbox-checker.appwrite.network/badge/inbox/stripe.com.svg)](https://inbox-checker.appwrite.network/?domain=stripe.com)
[![AI CiteReady](https://citeready-checker.appwrite.network/badge/citeready/stripe.com.svg)](https://citeready-checker.appwrite.network/?url=https://stripe.com)

**Zero-dependency Model Context Protocol (MCP) server for pre-launch startup & domain audits** — combining live IANA RDAP domain + developer handle + USPTO trademark conflict checks, recursive SPF/DKIM/DMARC/DNSBL email deliverability verification, and AI search (`robots.txt`, `/llms.txt`, Schema.org JSON-LD) readiness in one lightweight package.

Works out of the box with **zero API keys**, **zero `npm` sub-dependencies**, and **zero configuration** in Claude Desktop, Claude Code, Cursor, Windsurf, Cline, and VS Code — and pairs directly with the **OmniForge v5.0 Online Web Pro Suite** (`$9/$12/$15/$29` one-time).

---

## Quick Start

### Option A: Local `stdio` via `npx` (Recommended)

Add to your `claude_desktop_config.json`, `.cursor/mcp.json`, or `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "launch-audit": {
      "command": "npx",
      "args": ["-y", "github:zColdWater/mcp-launch-audit"]
    }
  }
}
```

Or add in one command with **Claude Code**:

```bash
claude mcp add launch-audit -- npx -y github:zColdWater/mcp-launch-audit
```

### Option B: Zero-Install Remote Streamable-HTTP Endpoint

Prefer a hosted MCP connector with no local runtime? Point any Streamable-HTTP MCP client directly at:

```text
https://brand-checker.appwrite.network/mcp
```

```bash
claude mcp add --transport http launch-audit https://brand-checker.appwrite.network/mcp
```

### Option C: Docker

```bash
docker build -t mcp-launch-audit .
docker run -i --rm mcp-launch-audit
```

---

## Included MCP Tools (4)

| Tool | What It Audits | Output |
| :--- | :--- | :--- |
| `check_brand_availability` | Live RDAP/DNS across `.com/.io/.ai/.dev`, public developer handles (`GitHub`, `npm`, `PyPI`, `Bluesky`), and live USPTO trademark filings | `0-100` Brand Readiness Score + per-TLD & trademark breakdown |
| `audit_email_deliverability` | MX servers, ESP auto-detection, recursive SPF lookup count against RFC 7208's 10-lookup hard cap, DKIM selectors, DMARC policy, MTA-STS, BIMI, and DNSBL blacklists | `0-100` Deliverability Score + actionable DNS fixes |
| `audit_ai_search_visibility` | `/robots.txt` rules across AI search crawlers (`OAI-SearchBot`, `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, etc.), `/llms.txt` & `/llms-full.txt` validation, and Schema.org `application/ld+json` extraction | `0-100` AI Search (GEO) Score + visibility gaps |
| `full_launch_readiness_audit` | Runs all 3 pillars in parallel on a production domain | Weighted `0-100` Launch Scorecard + prioritized pre-launch checklist |

All tools are strictly **read-only** (`readOnlyHint: true`, `destructiveHint: false`) — they never register domains, modify DNS records, or store queried brand names.

---

## OmniForge v5.0 Online Web Apps & Web Pro Suite (Zero Install, One-Time Unlock)

Want a visual browser workspace with **2-second live audits, 5-platform step-by-step fix wizards, 50-item batch CSV exports, and printable A4 PDF client reports**? Try all 4 flagship v5.0 web apps free, or unlock Web Pro once with a **14-day refund guarantee**:

| Pillar | Live v5.0 Free Web App | Open-Source Repo | Web Pro (One-Time In-Page Unlock) |
| :--- | :--- | :--- | :--- |
| **Pre-Launch Security & RLS** | [vibe-checker.appwrite.network](https://vibe-checker.appwrite.network) | JS Bundles + 38 Secret Rules + Supabase RLS | [VibeShield Pro ($9)](https://omnipulse-x402.appwrite.network/go/gumroad/vibeshield) · [Direct](https://omnipulse-x402.appwrite.network/checkout/vibeshield) |
| **Brand & Trademarks** | [brand-checker.appwrite.network](https://brand-checker.appwrite.network) · [/namer](https://brand-checker.appwrite.network/namer) | [zColdWater/brandshield-cli](https://github.com/zColdWater/brandshield-cli) | [BrandShield Pro ($12)](https://omnipulse-x402.appwrite.network/go/gumroad/brandshield) · [Direct](https://omnipulse-x402.appwrite.network/checkout/brandshield) |
| **AI Search & `/llms.txt`** | [citeready-checker.appwrite.network](https://citeready-checker.appwrite.network) · [/generator](https://citeready-checker.appwrite.network/generator) | [zColdWater/citeready-cli](https://github.com/zColdWater/citeready-cli) | [CiteReady Pro ($12)](https://omnipulse-x402.appwrite.network/go/gumroad/citeready) · [Direct](https://omnipulse-x402.appwrite.network/checkout/citeready) |
| **Email Deliverability** | [inbox-checker.appwrite.network](https://inbox-checker.appwrite.network) · [/spf-flattener](https://inbox-checker.appwrite.network/spf-flattener) | [zColdWater/inboxshield-cli](https://github.com/zColdWater/inboxshield-cli) | [InboxShield Pro ($15)](https://omnipulse-x402.appwrite.network/go/gumroad/inboxshield) · [Direct](https://omnipulse-x402.appwrite.network/checkout/inboxshield) |
| **4-in-1 Launch Stack** | Unlocks Web Pro across all 4 web apps | 228 SaaS Benchmarks: [launch-audit-reports](https://zcoldwater.github.io/launch-audit-reports/) | [4-in-1 Launch Stack ($29 — Save $19)](https://omnipulse-x402.appwrite.network/go/gumroad/launch-stack) · [Direct](https://omnipulse-x402.appwrite.network/checkout/launch-stack) |

---

## Development & Verification

```bash
npm test
```

## Support & Contact

OmniForge · Agent Arena Studio — `agentarenastudio@proton.me` · [@agentarenastudi](https://x.com/agentarenastudi) · [Support Portal](https://omnipulse-x402.appwrite.network/support) · [14-Day Refund Policy](https://omnipulse-x402.appwrite.network/refund-policy)

## License

[MIT](./LICENSE) © OmniForge · Agent Arena Studio
