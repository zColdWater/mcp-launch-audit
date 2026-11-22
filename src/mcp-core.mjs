import {
  runBrandAudit,
  runEmailDeliverabilityAudit,
  runAiSearchVisibilityAudit,
  runFullLaunchAudit,
} from "./audit-engine.mjs";

export const SERVER_INFO = {
  name: "mcp-launch-audit",
  version: "1.0.0",
};

const SUPPORTED_VERSIONS = new Set(["2025-03-26", "2024-11-05", "2024-10-07"]);

export const TOOLS = [
  {
    name: "check_brand_availability",
    title: "Brand, Domain & USPTO Trademark Availability Check",
    description:
      "Check a single candidate startup or product name across top TLDs (.com, .io, .ai, .dev via live RDAP/DNS), public developer handles (GitHub, npm, PyPI, Bluesky), and live USPTO trademark records, returning a 0-100 Brand Readiness Score. Use this tool when evaluating candidate names before registering a domain; use `full_launch_readiness_audit` instead when auditing an already-chosen domain across brand, email DNS, and AI search visibility together.",
    annotations: {
      title: "Brand & Trademark Availability Check",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Candidate brand or product name to screen (alphanumeric label, e.g. 'linear' or 'resend').",
        },
        tlds: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of domain extensions without leading dots (defaults to ['com', 'io', 'ai', 'dev'], max 6).",
          default: ["com", "io", "ai", "dev"],
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        checkedAt: { type: "string", description: "ISO-8601 UTC timestamp of the live check." },
        candidate: { type: "string", description: "Normalized lowercase brand label." },
        score: { type: "integer", minimum: 0, maximum: 100, description: "0-100 Brand Readiness Score." },
        grade: { type: "string", description: "Letter grade from A to D." },
        domains: { type: "array", description: "Per-TLD RDAP/DNS registration statuses." },
        handles: { type: "array", description: "Public handle availability statuses." },
        trademarks: { type: "array", description: "Matched live USPTO trademark filings, if any." },
        issues: { type: "array", items: { type: "string" }, description: "Detected naming or conflict blockers." },
        upgradeLinks: { type: "object", description: "Links for batch CSV screening and Nice Class clearance." },
      },
      required: ["checkedAt", "candidate", "score", "grade", "domains", "issues"],
    },
  },
  {
    name: "audit_email_deliverability",
    title: "SPF, DKIM, DMARC & DNSBL Email Deliverability Audit",
    description:
      "Audit a sending domain's email authentication and inbox placement health: resolves MX servers, recursively counts SPF DNS lookups against the RFC 7208 10-lookup hard limit, probes 18 standard ESP DKIM selectors, validates DMARC policy enforcement, checks MTA-STS/BIMI, and tests the primary mail IP against major DNSBL blacklists. Use this tool for diagnosing why transactional or marketing emails land in spam; use `full_launch_readiness_audit` when also checking brand conflicts and AI search crawlers.",
    annotations: {
      title: "Email Deliverability & DNS Auth Audit",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Target sending domain to inspect (e.g. 'stripe.com' or 'acme.io').",
        },
      },
      required: ["domain"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        checkedAt: { type: "string", description: "ISO-8601 UTC timestamp." },
        domain: { type: "string", description: "Normalized domain name." },
        detectedProvider: { type: "string", description: "Detected email service provider (Google Workspace, Microsoft 365, Resend, Amazon SES, etc.)." },
        score: { type: "integer", minimum: 0, maximum: 100, description: "0-100 Deliverability Readiness Score." },
        grade: { type: "string", description: "Letter grade from A to D." },
        mxRecords: { type: "array", items: { type: "string" }, description: "Ordered MX hostnames." },
        spf: { type: "object", description: "SPF record text and recursive DNS lookup count." },
        dkim: { type: "object", description: "Discovered active DKIM selectors." },
        dmarc: { type: "object", description: "DMARC record and enforcement policy." },
        blacklists: { type: "array", items: { type: "string" }, description: "DNSBL blacklists flagging the primary MX IP." },
        issues: { type: "array", items: { type: "string" }, description: "Actionable DNS authentication issues." },
        upgradeLinks: { type: "object", description: "Links for automatic SPF flattening and 24/7 drift alerts." },
      },
      required: ["checkedAt", "domain", "detectedProvider", "score", "grade", "spf", "dmarc", "issues"],
    },
  },
  {
    name: "audit_ai_search_visibility",
    title: "AI Search (GEO), Crawler Access & llms.txt Readiness Audit",
    description:
      "Inspect a live website URL for Generative Engine Optimization (GEO) and AI assistant citation readiness: verifies whether `/robots.txt` allows 8 major AI search crawlers (OAI-SearchBot, GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot), validates `/llms.txt` and `/llms-full.txt` Markdown indexes, and extracts Schema.org `application/ld+json` entities. Use this tool for AI SEO and `/llms.txt` checks on a single URL; use `full_launch_readiness_audit` when running a complete pre-launch sweep.",
    annotations: {
      title: "AI Search & llms.txt Visibility Audit",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Public website URL or domain to inspect (e.g. 'https://cal.com' or 'linear.app').",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        checkedAt: { type: "string", description: "ISO-8601 UTC timestamp." },
        url: { type: "string", description: "Normalized URL inspected." },
        score: { type: "integer", minimum: 0, maximum: 100, description: "0-100 AI Search Visibility Score." },
        grade: { type: "string", description: "Letter grade from A to D." },
        aiCrawlers: { type: "object", description: "Allowed and blocked AI crawler summary." },
        llmsTxt: { type: "object", description: "/llms.txt and /llms-full.txt availability details." },
        structuredData: { type: "object", description: "Detected Schema.org JSON-LD types and metadata tags." },
        issues: { type: "array", items: { type: "string" }, description: "Actionable GEO visibility fixes." },
        upgradeLinks: { type: "object", description: "Links for automated 500-page /llms.txt compilation." },
      },
      required: ["checkedAt", "url", "score", "grade", "aiCrawlers", "llmsTxt", "issues"],
    },
  },
  {
    name: "full_launch_readiness_audit",
    title: "3-in-1 Startup & Domain Launch Readiness Audit",
    description:
      "Run a comprehensive, parallel 3-pillar pre-launch audit on a production domain — combining brand/trademark conflict screening, SPF/DKIM/DMARC/DNSBL email deliverability verification, and AI search (`robots.txt`, `/llms.txt`, Schema.org JSON-LD) readiness into one unified 0-100 Launch Scorecard and prioritized remediation checklist. Reach for this tool when preparing a domain for launch or diagnosing overall technical growth readiness; use the specialized single-pillar tools when iterating on just one area.",
    annotations: {
      title: "3-in-1 Full Launch Readiness Audit",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Primary production domain to audit (e.g. 'resend.com' or 'acme.io').",
        },
        brandName: {
          type: "string",
          description: "Optional brand label if different from the domain's second-level label.",
        },
      },
      required: ["domain"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        checkedAt: { type: "string", description: "ISO-8601 UTC timestamp." },
        domain: { type: "string", description: "Normalized production domain." },
        overallScore: { type: "integer", minimum: 0, maximum: 100, description: "Weighted 0-100 Launch Readiness Score." },
        overallGrade: { type: "string", description: "Overall letter grade from A to D." },
        pillars: { type: "object", description: "Per-pillar scores and key indicators." },
        prioritizedFixes: { type: "array", items: { type: "string" }, description: "Ordered list of highest-impact fixes." },
        bundleUpgrade: { type: "object", description: "Links to the 3-in-1 Pro CLI & CI remediation bundle." },
      },
      required: ["checkedAt", "domain", "overallScore", "overallGrade", "pillars", "prioritizedFixes"],
    },
  },
];

export const PROMPTS = [
  {
    name: "pre-launch-checklist",
    description: "Run a complete 3-pillar technical launch readiness audit (Brand + Email DNS + AI Search GEO) and generate a prioritized remediation plan.",
    arguments: [
      { name: "domain", description: "Production domain to audit (e.g. acme.io)", required: true },
    ],
  },
  {
    name: "fix-emails-going-to-spam",
    description: "Diagnose SPF 10-lookup limits, missing DKIM selectors, and DMARC p=none gaps on a sending domain.",
    arguments: [
      { name: "domain", description: "Sending domain experiencing inbox placement issues", required: true },
    ],
  },
];

export const RESOURCES = [
  {
    uri: "launch-audit://catalog/pro-toolkits",
    name: "OmniForge Pro Offline CLI & CI Remediation Toolkits",
    description: "Reference matrix comparing free single-domain MCP checks with offline batch CSV, SPF flattening, and 500-page /llms.txt compilation in the Pro toolkits.",
    mimeType: "application/json",
  },
];

function formatMarkdownSummary(toolName, data) {
  if (toolName === "check_brand_availability") {
    return [
      `## Brand Availability Report: \`${data.candidate}\` — **${data.score}/100 (Grade ${data.grade})**`,
      `- **Domains:** ${data.domains.map((d) => `\`${d.domain}\`: **${d.status}**`).join(" · ")}`,
      `- **Developer Handles:** ${data.handles.map((h) => `${h.platform}: **${h.status}**`).join(" · ") || "n/a"}`,
      `- **USPTO Live Trademarks:** ${data.trademarks.length ? data.trademarks.map((t) => `${t.wordMark} (#${t.serialNumber})`).join(", ") : "None matched"}`,
      data.issues.length ? `\n### Detected Risks\n${data.issues.map((i) => `- ${i}`).join("\n")}` : "\nNo major naming blockers detected.",
      `\n### Need Batch CSV Screening (500 Names) or 60+ Verified Variations?\n- Interactive Report: ${data.upgradeLinks.interactiveReportUrl}\n- **BrandShield Pro ($19 one-time):** ${data.upgradeLinks.gumroadUrl} | [Direct Checkout](${data.upgradeLinks.directCheckoutUrl})`,
    ].join("\n");
  }

  if (toolName === "audit_email_deliverability") {
    return [
      `## Email Deliverability Audit: \`${data.domain}\` — **${data.score}/100 (Grade ${data.grade})**`,
      `- **Detected ESP:** ${data.detectedProvider}`,
      `- **SPF Lookups:** ${data.spf.present ? `${data.spf.dnsLookups}/10 lookups (\`${data.spf.record}\`)` : "Missing"}`,
      `- **Active DKIM Selectors:** ${data.dkim.detectedSelectors.length ? data.dkim.detectedSelectors.join(", ") : "None detected across 18 standard selectors"}`,
      `- **DMARC Policy:** \`${data.dmarc.policy}\` ${data.dmarc.record ? `(\`${data.dmarc.record}\`)` : ""}`,
      `- **DNSBL Blacklists:** ${data.blacklists.length ? data.blacklists.join(", ") : "Clean (0 listings)"}`,
      data.issues.length ? `\n### Priority Fixes\n${data.issues.map((i) => `- ${i}`).join("\n")}` : "\nAll core email authentication checks passed.",
      `\n### Need Automatic SPF Flattening, 500-Domain Batch Audit or 24/7 Drift Alerts?\n- Live Custom Fix Preview: ${data.upgradeLinks.interactiveReportUrl}\n- **InboxShield Pro ($29 one-time):** ${data.upgradeLinks.gumroadUrl} | [Direct Checkout](${data.upgradeLinks.directCheckoutUrl})`,
    ].join("\n");
  }

  if (toolName === "audit_ai_search_visibility") {
    return [
      `## AI Search (GEO) & llms.txt Audit: \`${data.url}\` — **${data.score}/100 (Grade ${data.grade})**`,
      `- **AI Crawlers Allowed:** ${data.aiCrawlers.allowedCount}/${data.aiCrawlers.totalChecked}${data.aiCrawlers.blockedBots.length ? ` (Blocked: ${data.aiCrawlers.blockedBots.join(", ")})` : " (All major AI search bots allowed)"}`,
      `- **/llms.txt Index:** ${data.llmsTxt.present ? `Present (${data.llmsTxt.bytes} bytes)` : "Missing"} · **/llms-full.txt:** ${data.llmsTxt.llmsFullPresent ? "Present" : "Missing"}`,
      `- **Schema.org JSON-LD:** ${data.structuredData.schemaTypes.length ? data.structuredData.schemaTypes.join(", ") : "None detected"}`,
      data.issues.length ? `\n### Visibility Gaps\n${data.issues.map((i) => `- ${i}`).join("\n")}` : "\nStrong AI search citation readiness.",
      `\n### Auto-Compile /llms.txt & Schema.org Across 500 Pages Locally\n- Interactive GEO Workbench Preview: ${data.upgradeLinks.interactiveReportUrl}\n- **CiteReady Pro ($19 one-time):** ${data.upgradeLinks.gumroadUrl} | [Direct Checkout](${data.upgradeLinks.directCheckoutUrl})`,
    ].join("\n");
  }

  return [
    `## 3-in-1 Launch Readiness Scorecard: \`${data.domain}\` — **${data.overallScore}/100 (Grade ${data.overallGrade})**`,
    `- **Brand & Trademark (\`${data.brandCandidate}\`):** ${data.pillars.brandAvailability.score}/100 (${data.pillars.brandAvailability.grade})`,
    `- **Email Deliverability (${data.pillars.emailDeliverability.detectedProvider}):** ${data.pillars.emailDeliverability.score}/100 (${data.pillars.emailDeliverability.grade}) — SPF ${data.pillars.emailDeliverability.spfLookups}/10, DMARC \`${data.pillars.emailDeliverability.dmarcPolicy}\``,
    `- **AI Search & GEO:** ${data.pillars.aiSearchVisibility.score}/100 (${data.pillars.aiSearchVisibility.grade}) — \`/llms.txt\`: ${data.pillars.aiSearchVisibility.hasLlmsTxt ? "Yes" : "No"}`,
    data.prioritizedFixes.length ? `\n### Prioritized Pre-Launch Remediation Checklist\n${data.prioritizedFixes.map((f) => `- ${f}`).join("\n")}` : "\nAll 3 launch readiness pillars look healthy!",
    `\n### Unlock All 3 Pro Remediation Toolkits (Save $38)\n- **OmniForge 3-in-1 Founder Launch Stack ($49 Solo / $89 Agency):** ${data.bundleUpgrade.gumroadUrl} | [Direct Checkout](${data.bundleUpgrade.directCheckoutUrl})`,
  ].join("\n");
}

export async function dispatchJsonRpcMessage(msg) {
  if (!msg || typeof msg !== "object") {
    return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } };
  }

  // Notifications have no `id` and MUST NOT produce a response
  if (msg.id === undefined) return null;

  const { id, method, params = {} } = msg;

  try {
    if (method === "initialize") {
      const requested = String(params?.protocolVersion || "2024-11-05");
      const protocolVersion = SUPPORTED_VERSIONS.has(requested) ? requested : "2024-11-05";
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion,
          capabilities: {
            tools: { listChanged: false },
            prompts: { listChanged: false },
            resources: { listChanged: false },
          },
          serverInfo: SERVER_INFO,
          instructions:
            "Use check_brand_availability, audit_email_deliverability, audit_ai_search_visibility, or full_launch_readiness_audit to run live pre-launch technical audits on domains and candidate startup names.",
        },
      };
    }

    if (method === "ping") {
      return { jsonrpc: "2.0", id, result: {} };
    }

    if (method === "tools/list") {
      return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
    }

    if (method === "tools/call") {
      const name = params?.name;
      const args = params?.arguments || {};
      let data;
      if (name === "check_brand_availability") data = await runBrandAudit(args);
      else if (name === "audit_email_deliverability") data = await runEmailDeliverabilityAudit(args);
      else if (name === "audit_ai_search_visibility") data = await runAiSearchVisibilityAudit(args);
      else if (name === "full_launch_readiness_audit") data = await runFullLaunchAudit(args);
      else {
        return { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool: ${name}` } };
      }
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: formatMarkdownSummary(name, data) }],
          structuredContent: data,
          isError: false,
        },
      };
    }

    if (method === "prompts/list") {
      return { jsonrpc: "2.0", id, result: { prompts: PROMPTS } };
    }

    if (method === "prompts/get") {
      const pName = params?.name;
      const dom = params?.arguments?.domain || "example.com";
      if (pName === "pre-launch-checklist") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            description: `3-pillar launch audit for ${dom}`,
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Run full_launch_readiness_audit on "${dom}" and give me an ordered checklist of exact DNS records, robots.txt/llms.txt updates, and brand conflict mitigations needed before launch.`,
                },
              },
            ],
          },
        };
      }
      if (pName === "fix-emails-going-to-spam") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            description: `Email deliverability triage for ${dom}`,
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Run audit_email_deliverability on "${dom}", explain why emails may be landing in spam, and show exact SPF, DKIM, and DMARC remediations.`,
                },
              },
            ],
          },
        };
      }
      return { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown prompt: ${pName}` } };
    }

    if (method === "resources/list") {
      return { jsonrpc: "2.0", id, result: { resources: RESOURCES } };
    }

    if (method === "resources/read") {
      const uri = params?.uri;
      if (uri === "launch-audit://catalog/pro-toolkits") {
        const catalog = {
          provider: "OmniForge Studio",
          freeMcpCapabilities: [
            "Single-name RDAP + developer handle + USPTO trademark check",
            "Single-domain SPF 10-lookup counter + 18-selector DKIM + DMARC + DNSBL check",
            "Single-URL AI crawler robots.txt + /llms.txt + Schema.org JSON-LD audit",
          ],
          proToolkits: [
            { name: "BrandShield Pro", soloUsd: 19, agencyUsd: 39, gumroadUrl: "https://agentarenastudi.gumroad.com/l/omniforge-brandshield", directCheckoutUrl: "https://omnipulse-x402.appwrite.network/checkout/brandshield" },
            { name: "InboxShield Pro", soloUsd: 29, agencyUsd: 49, gumroadUrl: "https://omnipulse-x402.appwrite.network/go/gumroad/inboxshield", directCheckoutUrl: "https://omnipulse-x402.appwrite.network/checkout/inboxshield" },
            { name: "CiteReady Pro", soloUsd: 19, agencyUsd: 39, gumroadUrl: "https://omnipulse-x402.appwrite.network/go/gumroad/citeready", directCheckoutUrl: "https://omnipulse-x402.appwrite.network/checkout/citeready" },
            { name: "OmniForge 3-in-1 Founder Launch Stack", soloUsd: 49, agencyUsd: 89, gumroadUrl: "https://omnipulse-x402.appwrite.network/go/gumroad/launch-stack", directCheckoutUrl: "https://omnipulse-x402.appwrite.network/checkout/launch-stack" },
          ],
        };
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify(catalog, null, 2) }],
          },
        };
      }
      return { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown resource URI: ${uri}` } };
    }

    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: `Audit error: ${String(err?.message || err)}` }],
        isError: true,
      },
    };
  }
}
