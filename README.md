# mcp-launch-audit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-success.svg)](./package.json)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--03--26%20%7C%202024--11--05-7c3aed.svg)](https://modelcontextprotocol.io)
[![BrandShield](https://brand-checker.appwrite.network/badge/brand/BrandShieldCLI.svg)](https://brand-checker.appwrite.network/report/BrandShieldCLI)
[![Email Security](https://inbox-checker.appwrite.network/badge/inbox/stripe.com.svg)](https://inbox-checker.appwrite.network/?domain=stripe.com)
[![AI CiteReady](https://citeready-checker.appwrite.network/badge/citeready/stripe.com.svg)](https://citeready-checker.appwrite.network/?url=https://stripe.com)

**Zero-dependency Model Context Protocol (MCP) server for pre-launch startup & domain audits** — combining live RDAP domain + developer handle + USPTO trademark conflict checks, recursive SPF/DKIM/DMARC/DNSBL email deliverability verification, and AI search (`robots.txt`, `/llms.txt`, Schema.org JSON-LD) readiness in one lightweight package.

Works out of the box with **zero API keys**, **zero `npm` sub-dependencies**, and **zero configuration** in Claude Desktop, Claude Code, Cursor, Windsurf, Cline, and VS Code.

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
| `audit_email_deliverability` | MX servers, ESP auto-detection, recursive SPF lookup count against RFC 7208's 10-lookup hard cap, 18 standard DKIM selectors, DMARC policy, MTA-STS, BIMI, and DNSBL blacklists | `0-100` Deliverability Score + actionable DNS fixes |
| `audit_ai_search_visibility` | `/robots.txt` rules across 8 AI search crawlers (`OAI-SearchBot`, `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, etc.), `/llms.txt` & `/llms-full.txt` validation, and Schema.org `application/ld+json` extraction | `0-100` AI Search (GEO) Score + visibility gaps |
| `full_launch_readiness_audit` | Runs all 3 pillars in parallel on a production domain | Weighted `0-100` Launch Scorecard + prioritized pre-launch checklist |

All tools are strictly **read-only** (`readOnlyHint: true`, `destructiveHint: false`) — they never register domains, modify DNS records, or store queried brand names.

---

## Interactive Web Diagnostics & Pro Offline Toolkits

Need batch CSV screening across 500 names/domains, automatic SPF flattening, 500-page `/llms.txt` compilation, or CI/CD gates?

| Pillar | Free Interactive Web App | Open-Source CLI & GitHub Action | Pro Offline Suite & Agency License |
| :--- | :--- | :--- | :--- |
| **Brand & Trademarks** | [brand-checker.appwrite.network](https://brand-checker.appwrite.network) | [zColdWater/brandshield-cli](https://github.com/zColdWater/brandshield-cli) | [BrandShield Pro ($19)](https://agentarenastudi.gumroad.com/l/omniforge-brandshield) · [Direct Checkout](https://omnipulse-x402.appwrite.network/checkout/brandshield) |
| **Email Deliverability** | [inbox-checker.appwrite.network](https://inbox-checker.appwrite.network) | [zColdWater/inboxshield-cli](https://github.com/zColdWater/inboxshield-cli) | [InboxShield Pro ($29)](https://omnipulse-x402.appwrite.network/go/gumroad/inboxshield) · [Direct Checkout](https://omnipulse-x402.appwrite.network/checkout/inboxshield) |
| **AI Search & `llms.txt`** | [citeready-checker.appwrite.network](https://citeready-checker.appwrite.network) | [zColdWater/citeready-cli](https://github.com/zColdWater/citeready-cli) | [CiteReady Pro ($19)](https://omnipulse-x402.appwrite.network/go/gumroad/citeready) · [Direct Checkout](https://omnipulse-x402.appwrite.network/checkout/citeready) |
| **3-in-1 Launch Bundle** | All 3 Web Checkers | All 3 GitHub Actions | [Founder Launch Stack ($49 — Save $38)](https://omnipulse-x402.appwrite.network/go/gumroad/launch-stack) · [Direct Checkout](https://omnipulse-x402.appwrite.network/checkout/launch-stack) |

---

## Development & Verification

```bash
npm test
```

## License

[MIT](./LICENSE) © OmniForge Studio
