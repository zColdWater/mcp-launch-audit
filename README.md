# mcp-launch-audit (`v2.0.0`)

[![zColdWater/mcp-launch-audit MCP server](https://glama.ai/mcp/servers/zColdWater/mcp-launch-audit/badges/score.svg)](https://glama.ai/mcp/servers/zColdWater/mcp-launch-audit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-success.svg)](./package.json)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--03--26%20%7C%202024--11--05-7c3aed.svg)](https://modelcontextprotocol.io)
[![OmniForge Launch Score](https://omnipulse-x402.appwrite.network/v1/badge/suite.svg?domain=vibe-checker.appwrite.network)](https://zcoldwater.github.io/omniforge-skills/black-friday-2026-developer-security-deal.html)
[![Live VibeShield Score](https://vibe-checker.appwrite.network/api/badge.svg?url=vibe-checker.appwrite.network)](https://vibe-checker.appwrite.network/?url=https://vibe-checker.appwrite.network/)
[![AI Search Readiness](https://citeready-checker.appwrite.network/api/badge?url=citeready-checker.appwrite.network)](https://citeready-checker.appwrite.network/?url=https://citeready-checker.appwrite.network/)
[![Email Security](https://inbox-checker.appwrite.network/badge/inbox/stripe.com.svg)](https://inbox-checker.appwrite.network/?domain=stripe.com)

**Zero-dependency Model Context Protocol (MCP) server for pre-launch startup & AI app audits** — combining **VibeShield v7.0** (6-phase web security, 52 secret rules, 28 SPA-filtered probes, TLS 443, CNAME takeover, Supabase RLS, Firebase RTDB/Firestore, Observatory CSP & CVEs), **BrandShield v6.2** (RDAP + handles + USPTO trademarks), **InboxShield v7.0** (SPF/DKIM/DMARC/DNSBL email deliverability), and **CiteReady** (`robots.txt`, `/llms.txt`, Schema.org JSON-LD) in one zero-dependency package.

Works out of the box with **zero API keys**, **zero `npm` sub-dependencies**, and **zero configuration** in Claude Desktop, Claude Code, Cursor, Windsurf, Cline, and VS Code.

- **Companion 50-Skill Pack (`skills.sh`):** `npx skills add zColdWater/omniforge-skills` ([50 Interactive Guides](https://zcoldwater.github.io/omniforge-skills/) · [skills.sh Registry](https://www.skills.sh/zColdWater/omniforge-skills))
- **Zero-Install 1-Line Terminal Audit (`cli.sh`):** `curl -fsSL https://vibe-checker.appwrite.network/cli.sh | sh -s -- --suite yourdomain.com`
- **2026 Flagship Empirical Report & Interactive Workbenches:** [390-Audit Report Hub](https://zcoldwater.github.io/omniforge-skills/state-of-ai-startup-infrastructure-2026.html) · [24-Point Pre-Launch Checklist](https://zcoldwater.github.io/omniforge-skills/pre-launch-security-checklist-2026.html) · [Live README SVG Badge Studio](https://zcoldwater.github.io/omniforge-skills/launch-score-badge-generator.html) · [3-Year TCO Calculator](https://zcoldwater.github.io/omniforge-skills/saas-security-tco-calculator-2026.html) · [Vibe-Coding Security Cheat Sheet (8 Fix Prompts)](https://zcoldwater.github.io/omniforge-skills/vibecoding-security-cheat-sheet-2026.html)
- **Black Friday 2026 Developer Deal Stack ($2 Single / $5 Complete 3-in-1 Suite — 83% OFF, One-Time):** [View Deal Stack](https://zcoldwater.github.io/omniforge-skills/black-friday-2026-developer-security-deal.html)

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

```bash
claude mcp add --transport http launch-audit https://brand-checker.appwrite.network/mcp
```

### Option C: Docker

```bash
docker build -t mcp-launch-audit .
docker run -i --rm mcp-launch-audit
```

---

## Included MCP Tools (5)

| Tool | What It Audits | Output |
| :--- | :--- | :--- |
| `audit_web_app_security` | **NEW (VibeShield v7.0):** 6-phase read-only audit — real TLS 443 cert + CNAME takeover, up to 24 full JS bundles (<=2.5MB) across 52 secret patterns, 28 SPA-filtered probes, Supabase (20 tables) & Firebase RTDB/Firestore checks, 10 Observatory headers + CSP AST + passive CVEs (`CVE-2025-29927`, `CVE-2025-48757`) | `0-100` Security Score + prioritized findings |
| `check_brand_availability` | Live RDAP/DNS across `.com/.io/.ai/.dev`, public developer handles (`GitHub`, `npm`, `PyPI`, `Bluesky`), and live USPTO trademark filings | `0-100` Brand Readiness Score + per-TLD & trademark breakdown |
| `audit_email_deliverability` | MX servers, ESP auto-detection, recursive SPF lookup count against RFC 7208's 10-lookup hard cap, DKIM selectors, DMARC policy enforcement, MTA-STS, BIMI, and DNSBL blacklists | `0-100` Deliverability Score + actionable DNS fixes |
| `audit_ai_search_visibility` | `/robots.txt` rules across 8 AI search crawlers (`OAI-SearchBot`, `GPTBot`, `PerplexityBot`, `ClaudeBot`, etc.), `/llms.txt` & `/llms-full.txt` validation, and Schema.org JSON-LD extraction | `0-100` AI Search (GEO) Score + visibility gaps |
| `full_launch_readiness_audit` | Runs Brand + Email DNS + AI Search pillars in parallel on a production domain | Weighted `0-100` Launch Scorecard + prioritized checklist |

All tools are strictly **read-only** (`readOnlyHint: true`, `destructiveHint: false`).

---

## OmniForge Online Web Tools (Zero Install)

| Pillar | Live Online Web App | Open-Source Repo | Pricing |
| :--- | :--- | :--- | :--- |
| **6-Phase Web & AI App Security** | [vibe-checker.appwrite.network](https://vibe-checker.appwrite.network) | [zColdWater/vibeshield-cli](https://github.com/zColdWater/vibeshield-cli) | Free 6-Phase Scan · [$2 Launch Special (~~$9~~)](https://omnipulse-x402.appwrite.network/go/gumroad/vibeshield) |
| **Email Deliverability & DMARC** | [inbox-checker.appwrite.network](https://inbox-checker.appwrite.network) · [/spf-flattener](https://inbox-checker.appwrite.network/spf-flattener) | [zColdWater/inboxshield-cli](https://github.com/zColdWater/inboxshield-cli) | Free 6-Phase Audit · [$2 Launch Special (~~$9~~)](https://omnipulse-x402.appwrite.network/go/gumroad/inboxshield) |
| **Domain, 78 TLDs & Aftermarket** | [brand-checker.appwrite.network](https://brand-checker.appwrite.network) · [/namer](https://brand-checker.appwrite.network/namer) | [zColdWater/brandshield-cli](https://github.com/zColdWater/brandshield-cli) | **100% Free Forever** |
| **AI Search & `/llms.txt`** | [citeready-checker.appwrite.network](https://citeready-checker.appwrite.network) · [/generator](https://citeready-checker.appwrite.network/generator) | [zColdWater/citeready-cli](https://github.com/zColdWater/citeready-cli) | Free Audit · [$2 Launch Special (~~$12~~)](https://omnipulse-x402.appwrite.network/go/gumroad/citeready) |
| **OmniForge Complete Suite** | Unlocks all Web Pro suites | 228+ Benchmarks: [launch-audit-reports](https://zcoldwater.github.io/launch-audit-reports/) | [$5 Launch Special (~~$29~~)](https://omnipulse-x402.appwrite.network/go/gumroad/launch-stack) |

---

## Development & Verification

```bash
npm test
```

## Support & Contact

OmniForge · Agent Arena Studio — `agentarenastudio@proton.me` · [@agentarenastudi](https://x.com/agentarenastudi) · [Support Portal](https://omnipulse-x402.appwrite.network/support) · [14-Day Refund Policy](https://omnipulse-x402.appwrite.network/refund-policy)

## License

[MIT](./LICENSE) (c) OmniForge · Agent Arena Studio
