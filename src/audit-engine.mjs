import dns from "node:dns/promises";

const UA = "Mozilla/5.0 (compatible; OmniForgeLaunchAuditMCP/1.0; +https://github.com/zColdWater/mcp-launch-audit)";

const RDAP_SERVERS = {
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
  org: "https://rdap.publicinterestregistry.org/rdap/domain/",
  io: "https://rdap.identitydigital.services/rdap/domain/",
  ai: "https://rdap.identitydigital.services/rdap/domain/",
  co: "https://rdap.identitydigital.services/rdap/domain/",
  dev: "https://pubapi.registry.google/rdap/domain/",
  app: "https://pubapi.registry.google/rdap/domain/",
};

const DKIM_SELECTORS = [
  "google", "default", "selector1", "selector2", "k1", "k2",
  "s1", "s2", "resend", "amazonses", "mandrill", "dkim",
  "mail", "smtp", "postmark", "pm", "protonmail", "zoho",
];

const DNSBL_ZONES = [
  "zen.spamhaus.org",
  "bl.spamcop.net",
  "b.barracudacentral.org",
];

const AI_BOTS = [
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

function sanitizeLabel(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.[a-z]{2,10}$/, "")
    .replace(/[^a-z0-9-]/g, "");
}

function sanitizeDomain(raw) {
  const cleaned = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
  if (!cleaned || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleaned)) {
    throw new Error(`Invalid domain "${raw}". Expected a bare domain like "acme.io" or URL like "https://acme.io".`);
  }
  return cleaned;
}

function normalizeUrl(raw) {
  let s = String(raw || "").trim();
  if (!s) throw new Error("Missing target URL or domain.");
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  const u = new URL(s);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`Unsupported protocol "${u.protocol}". Use https:// or http://.`);
  }
  return u;
}

async function fetchWithTimeout(url, opts = {}, ms = 6500) {
  return fetch(url, {
    ...opts,
    headers: { "User-Agent": UA, ...(opts.headers || {}) },
    signal: AbortSignal.timeout(ms),
  });
}

async function checkSingleDomainRdap(domain) {
  const tld = domain.split(".").pop();
  const base = RDAP_SERVERS[tld];
  if (base) {
    try {
      const r = await fetchWithTimeout(`${base}${domain}`, { headers: { Accept: "application/rdap+json" } }, 5000);
      if (r.status === 404) return { domain, status: "available", method: "rdap" };
      if (r.status === 200) return { domain, status: "taken", method: "rdap" };
    } catch {}
  }
  try {
    await dns.resolveAny(domain);
    return { domain, status: "taken", method: "dns" };
  } catch (e) {
    if (e && (e.code === "ENOTFOUND" || e.code === "ENODATA")) {
      return { domain, status: "likely_available", method: "dns" };
    }
    return { domain, status: "unknown", method: "dns" };
  }
}

async function checkPublicHandle(platform, handle) {
  try {
    if (platform === "github") {
      const r = await fetchWithTimeout(`https://api.github.com/users/${encodeURIComponent(handle)}`, {}, 4500);
      if (r.status === 404) return { platform, handle, status: "available" };
      if (r.status === 200) return { platform, handle, status: "taken" };
    } else if (platform === "npm") {
      const r = await fetchWithTimeout(`https://registry.npmjs.org/${encodeURIComponent(handle)}`, {}, 4500);
      if (r.status === 404) return { platform, handle, status: "available" };
      if (r.status === 200) return { platform, handle, status: "taken" };
    } else if (platform === "pypi") {
      const r = await fetchWithTimeout(`https://pypi.org/pypi/${encodeURIComponent(handle)}/json`, {}, 4500);
      if (r.status === 404) return { platform, handle, status: "available" };
      if (r.status === 200) return { platform, handle, status: "taken" };
    } else if (platform === "bluesky") {
      const r = await fetchWithTimeout(
        `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle + ".bsky.social")}`,
        {},
        4500
      );
      if (r.status === 400 || r.status === 404) return { platform, handle: `${handle}.bsky.social`, status: "available" };
      if (r.status === 200) return { platform, handle: `${handle}.bsky.social`, status: "taken" };
    }
  } catch {}
  return { platform, handle, status: "inconclusive" };
}

export async function runBrandAudit({ name, tlds = ["com", "io", "ai", "dev"] }) {
  const label = sanitizeLabel(name);
  if (!label) throw new Error(`Invalid candidate brand name "${name}". Provide an alphanumeric brand name.`);
  const cleanTlds = (Array.isArray(tlds) ? tlds : String(tlds).split(","))
    .map((t) => String(t).trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean)
    .slice(0, 6);

  // Try enriched cloud check first (includes live USPTO trademark & app store checks), fallback to pure local RDAP+API
  let cloudData = null;
  try {
    const u = `https://brand-checker.appwrite.network/check?names=${encodeURIComponent(label)}&tlds=${encodeURIComponent(cleanTlds.join(","))}&format=json`;
    const r = await fetchWithTimeout(u, {}, 7500);
    if (r.ok) {
      const j = await r.json();
      if (j && Array.isArray(j.results) && j.results[0]) cloudData = j.results[0];
    }
  } catch {}

  let domains;
  let handles;
  let trademarks = [];

  if (cloudData) {
    domains = (cloudData.domains || []).map((d) => ({
      domain: d.domain,
      status: d.status,
      source: d.source || "rdap",
    }));
    handles = (cloudData.handles || [])
      .filter((h) => ["available", "taken"].includes(h.status))
      .map((h) => ({ platform: h.platform, handle: h.handle || label, status: h.status }));
    trademarks = (cloudData.trademarks || []).slice(0, 5).map((tm) => ({
      wordMark: tm.wordMark || tm.mark || label.toUpperCase(),
      status: tm.status || "LIVE",
      serialNumber: String(tm.serialNumber || tm.serial || ""),
      owner: tm.owner || "",
    }));
  } else {
    domains = await Promise.all(cleanTlds.map((t) => checkSingleDomainRdap(`${label}.${t}`)));
    handles = await Promise.all(["github", "npm", "pypi", "bluesky"].map((p) => checkPublicHandle(p, label)));
  }

  const comEntry = domains.find((d) => d.domain.endsWith(".com"));
  const availDomains = domains.filter((d) => d.status === "available" || d.status === "likely_available").length;
  const availHandles = handles.filter((h) => h.status === "available").length;
  const liveTmConflicts = trademarks.filter((t) => /live/i.test(String(t.status))).length;

  let score = 50;
  if (comEntry?.status === "available") score += 25;
  else if (comEntry?.status === "taken") score -= 15;
  score += Math.min(20, availDomains * 6);
  score += Math.min(15, availHandles * 4);
  score -= Math.min(40, liveTmConflicts * 20);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
  const issues = [];
  if (comEntry && comEntry.status === "taken") issues.push(`${label}.com is already registered.`);
  if (liveTmConflicts > 0) issues.push(`${liveTmConflicts} live USPTO trademark record(s) matched "${label}".`);
  if (availHandles === 0 && handles.length > 0) issues.push(`Primary developer handles (${handles.map((h) => h.platform).join(", ")}) are already claimed.`);

  return {
    checkedAt: new Date().toISOString(),
    candidate: label,
    score,
    grade,
    domains,
    handles,
    trademarks,
    issues,
    upgradeLinks: {
      interactiveReportUrl: `https://brand-checker.appwrite.network/report/${encodeURIComponent(label)}`,
      nameGeneratorUrl: `https://brand-checker.appwrite.network/namer?q=${encodeURIComponent(label)}`,
      proToolkitName: "BrandShield Pro (500-name batch CSV, 60+ verified variations & Nice Class conflict matrix)",
      gumroadUrl: "https://omnipulse-x402.appwrite.network/go/gumroad/brandshield",
      directCheckoutUrl: `https://omnipulse-x402.appwrite.network/checkout/brandshield?domain=${encodeURIComponent(`${label}.com`)}`,
    },
  };
}

async function resolveTxtFlat(name) {
  try {
    const rows = await dns.resolveTxt(name);
    return rows.map((chunks) => chunks.join(""));
  } catch {
    return [];
  }
}

async function countSpfLookups(domain, visited = new Set(), depth = 0) {
  if (depth > 6 || visited.has(domain)) return { count: 0, record: null, permErrorLoop: visited.has(domain) };
  visited.add(domain);
  const txts = await resolveTxtFlat(domain);
  const spf = txts.find((t) => /^v=spf1\b/i.test(t.trim())) || null;
  if (!spf) return { count: 0, record: null, permErrorLoop: false };

  let count = 0;
  const tokens = spf.trim().split(/\s+/).slice(1);
  for (const tok of tokens) {
    const clean = tok.replace(/^[+?~-]/, "");
    if (/^(include|redirect)[:=]/i.test(clean)) {
      count += 1;
      const target = clean.split(/[:=]/)[1];
      if (target && !target.includes("%{")) {
        const sub = await countSpfLookups(target, visited, depth + 1);
        count += sub.count;
      }
    } else if (/^(a|mx|ptr|exists)\b/i.test(clean)) {
      count += 1;
    }
  }
  return { count, record: spf, permErrorLoop: false };
}

function detectEmailProvider(mxHosts, spfRecord) {
  const blob = `${mxHosts.join(" ")} ${spfRecord || ""}`.toLowerCase();
  if (blob.includes("google.com") || blob.includes("googlemail.com")) return "Google Workspace";
  if (blob.includes("outlook.com") || blob.includes("spf.protection.outlook.com")) return "Microsoft 365";
  if (blob.includes("resend")) return "Resend";
  if (blob.includes("amazonses.com")) return "Amazon SES";
  if (blob.includes("postmarkapp.com")) return "Postmark";
  if (blob.includes("protonmail.ch")) return "Proton Mail";
  if (blob.includes("zoho.com")) return "Zoho Mail";
  return "Custom / Unidentified ESP";
}

export async function runEmailDeliverabilityAudit({ domain }) {
  const cleanDomain = sanitizeDomain(domain);

  let mxRecords = [];
  try {
    const mx = await dns.resolveMx(cleanDomain);
    mxRecords = mx.sort((a, b) => a.priority - b.priority).map((m) => m.exchange.replace(/\.$/, ""));
  } catch {}

  const spfInfo = await countSpfLookups(cleanDomain);
  const dmarcTxts = await resolveTxtFlat(`_dmarc.${cleanDomain}`);
  const dmarcRecord = dmarcTxts.find((t) => /^v=DMARC1\b/i.test(t.trim())) || null;
  const dmarcPolicyMatch = dmarcRecord ? dmarcRecord.match(/\bp=([a-z]+)/i) : null;
  const dmarcPolicy = dmarcPolicyMatch ? dmarcPolicyMatch[1].toLowerCase() : "missing";

  const dkimChecks = await Promise.all(
    DKIM_SELECTORS.map(async (sel) => {
      const name = `${sel}._domainkey.${cleanDomain}`;
      const txts = await resolveTxtFlat(name);
      if (txts.some((t) => t.includes("v=DKIM1") || t.includes("p="))) return sel;
      try {
        const cn = await dns.resolveCname(name);
        if (cn && cn.length > 0) return sel;
      } catch {}
      return null;
    })
  );
  const activeDkimSelectors = dkimChecks.filter(Boolean);

  const mtaStsTxts = await resolveTxtFlat(`_mta-sts.${cleanDomain}`);
  const hasMtaSts = mtaStsTxts.some((t) => t.includes("v=STSv1"));
  const bimiTxts = await resolveTxtFlat(`default._bimi.${cleanDomain}`);
  const hasBimi = bimiTxts.some((t) => t.includes("v=BIMI1"));

  // Check primary MX IPv4 against top DNSBLs
  let mxIp = null;
  const listedBlacklists = [];
  if (mxRecords[0]) {
    try {
      const ips = await dns.resolve4(mxRecords[0]);
      mxIp = ips[0] || null;
      if (mxIp) {
        const rev = mxIp.split(".").reverse().join(".");
        await Promise.all(
          DNSBL_ZONES.map(async (zone) => {
            try {
              const res = await dns.resolve4(`${rev}.${zone}`);
              if (res && res.length > 0 && res.some((ip) => ip.startsWith("127.0.0."))) {
                listedBlacklists.push(zone);
              }
            } catch {}
          })
        );
      }
    } catch {}
  }

  let score = 0;
  const issues = [];
  if (mxRecords.length > 0) score += 15;
  else issues.push("No MX records found for domain.");

  if (spfInfo.record) {
    if (spfInfo.count > 10) {
      score += 8;
      issues.push(`CRITICAL: SPF requires ${spfInfo.count} DNS lookups (exceeds RFC 7208 hard limit of 10 -> causes PermError bounces). Flatten SPF immediately.`);
    } else if (spfInfo.count >= 8) {
      score += 20;
      issues.push(`WARNING: SPF uses ${spfInfo.count}/10 DNS lookups — adding one more SaaS sender risks PermError.`);
    } else {
      score += 25;
    }
    if (!/[-~]all\b/i.test(spfInfo.record)) {
      issues.push("SPF does not end with strict -all or ~all qualifier.");
    }
  } else {
    issues.push("Missing v=spf1 TXT record on root domain.");
  }

  if (activeDkimSelectors.length > 0) score += 25;
  else issues.push("No common public DKIM selector detected across 18 standard ESP selectors.");

  if (dmarcPolicy === "reject" || dmarcPolicy === "quarantine") {
    score += 25;
  } else if (dmarcPolicy === "none") {
    score += 10;
    issues.push("DMARC policy is p=none (monitoring-only; fails strict Gmail/Yahoo bulk spoofing enforcement). Upgrade to p=quarantine or p=reject.");
  } else {
    issues.push("Missing _dmarc TXT record (fails 2024+ Gmail/Yahoo bulk sender requirement).");
  }

  if (hasMtaSts) score += 5;
  if (hasBimi) score += 5;
  if (listedBlacklists.length > 0) {
    score = Math.max(0, score - 30);
    issues.push(`CRITICAL: MX IP ${mxIp} is listed on DNSBL: ${listedBlacklists.join(", ")}.`);
  }
  score = Math.min(100, score);
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 55 ? "C" : "D";

  return {
    checkedAt: new Date().toISOString(),
    domain: cleanDomain,
    detectedProvider: detectEmailProvider(mxRecords, spfInfo.record),
    score,
    grade,
    mxRecords,
    spf: {
      present: Boolean(spfInfo.record),
      record: spfInfo.record,
      dnsLookups: spfInfo.count,
      exceedsRfcLimit: spfInfo.count > 10,
    },
    dkim: {
      detectedSelectors: activeDkimSelectors,
    },
    dmarc: {
      present: Boolean(dmarcRecord),
      policy: dmarcPolicy,
      record: dmarcRecord,
    },
    mtaSts: hasMtaSts,
    bimi: hasBimi,
    blacklists: listedBlacklists,
    issues,
    upgradeLinks: {
      interactiveReportUrl: `https://inbox-checker.appwrite.network/?domain=${encodeURIComponent(cleanDomain)}`,
      freeSpfFlattenerUrl: `https://inbox-checker.appwrite.network/spf-flattener?domain=${encodeURIComponent(cleanDomain)}`,
      proToolkitName: "InboxShield Pro (Automatic SPF Flattener, 500-domain batch audit & 24/7 Slack/Discord drift alerts)",
      gumroadUrl: "https://omnipulse-x402.appwrite.network/go/gumroad/inboxshield",
      directCheckoutUrl: `https://omnipulse-x402.appwrite.network/checkout/inboxshield?domain=${encodeURIComponent(cleanDomain)}`,
    },
  };
}

function parseBlockedAiBots(robotsTxt) {
  if (!robotsTxt) return [];
  const blocked = new Set();
  const lines = robotsTxt.split(/\r?\n/);
  let currentAgents = [];
  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) {
      currentAgents = [];
      continue;
    }
    const [kRaw, ...rest] = line.split(":");
    const key = kRaw.trim().toLowerCase();
    const val = rest.join(":").trim();
    if (key === "user-agent") {
      currentAgents.push(val.toLowerCase());
    } else if (key === "disallow" && val === "/") {
      for (const bot of AI_BOTS) {
        if (currentAgents.includes(bot.toLowerCase()) || currentAgents.includes("*")) {
          blocked.add(bot);
        }
      }
    } else if (key === "allow" && val === "/") {
      for (const bot of AI_BOTS) {
        if (currentAgents.includes(bot.toLowerCase())) {
          blocked.delete(bot);
        }
      }
    }
  }
  return Array.from(blocked);
}

export async function runAiSearchVisibilityAudit({ url }) {
  const target = normalizeUrl(url);
  const origin = target.origin;

  const [homeRes, robotsRes, llmsRes, llmsFullRes] = await Promise.all([
    fetchWithTimeout(target.href, {}, 7500).catch(() => null),
    fetchWithTimeout(`${origin}/robots.txt`, {}, 5000).catch(() => null),
    fetchWithTimeout(`${origin}/llms.txt`, {}, 5000).catch(() => null),
    fetchWithTimeout(`${origin}/llms-full.txt`, {}, 5000).catch(() => null),
  ]);

  const html = homeRes && homeRes.ok ? await homeRes.text().catch(() => "") : "";
  const robotsTxt = robotsRes && robotsRes.ok ? await robotsRes.text().catch(() => "") : "";
  const llmsTxt = llmsRes && llmsRes.ok ? await llmsRes.text().catch(() => "") : "";
  const llmsFullTxt = llmsFullRes && llmsFullRes.ok ? await llmsFullRes.text().catch(() => "") : "";

  const hasValidLlmsTxt = Boolean(llmsTxt && !/<!doctype html/i.test(llmsTxt) && /^#\s+\S+/m.test(llmsTxt));
  const hasLlmsFullTxt = Boolean(llmsFullTxt && !/<!doctype html/i.test(llmsFullTxt) && llmsFullTxt.trim().length > 80);
  const blockedBots = parseBlockedAiBots(robotsTxt);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);

  const schemaTypes = [];
  const ldMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldMatches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      for (const it of items) {
        if (it && it["@type"]) {
          const t = Array.isArray(it["@type"]) ? it["@type"].join(",") : String(it["@type"]);
          schemaTypes.push(t);
        }
      }
    } catch {}
  }

  let score = 0;
  const issues = [];
  if (homeRes && homeRes.ok) score += 15;
  else issues.push(`Target page ${target.href} could not be fetched cleanly.`);

  if (blockedBots.length === 0) {
    score += 25;
  } else {
    score += Math.max(0, 25 - blockedBots.length * 5);
    issues.push(`robots.txt blocks ${blockedBots.length} AI search crawler(s): ${blockedBots.join(", ")}.`);
  }

  if (hasValidLlmsTxt) {
    score += 25;
  } else {
    issues.push(`Missing spec-compliant ${origin}/llms.txt index (AI assistants lack a curated Markdown map of your docs and pricing).`);
  }
  if (hasLlmsFullTxt) score += 10;

  if (schemaTypes.length > 0) {
    score += 15;
  } else {
    issues.push("No Schema.org application/ld+json structured data found on page.");
  }

  if (titleMatch?.[1]?.trim() && metaDescMatch?.[1]?.trim()) score += 10;
  else issues.push("Missing HTML <title> or meta description tag.");

  score = Math.min(100, score);
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 55 ? "C" : "D";

  return {
    checkedAt: new Date().toISOString(),
    url: target.href,
    origin,
    score,
    grade,
    aiCrawlers: {
      totalChecked: AI_BOTS.length,
      blockedBots,
      allowedCount: AI_BOTS.length - blockedBots.length,
    },
    llmsTxt: {
      present: hasValidLlmsTxt,
      llmsFullPresent: hasLlmsFullTxt,
      bytes: hasValidLlmsTxt ? llmsTxt.length : 0,
    },
    structuredData: {
      schemaTypes,
      hasTitle: Boolean(titleMatch?.[1]?.trim()),
      hasMetaDescription: Boolean(metaDescMatch?.[1]?.trim()),
      hasCanonical: Boolean(canonicalMatch?.[1]?.trim()),
    },
    issues,
    upgradeLinks: {
      interactiveReportUrl: `https://citeready-checker.appwrite.network/?url=${encodeURIComponent(target.href)}`,
      freeLlmsGeneratorUrl: `https://citeready-checker.appwrite.network/generator?url=${encodeURIComponent(target.href)}`,
      proToolkitName: "CiteReady Pro (500-page local crawler, automatic /llms.txt + JSON-LD compiler & CI visibility gate)",
      gumroadUrl: "https://omnipulse-x402.appwrite.network/go/gumroad/citeready",
      directCheckoutUrl: `https://omnipulse-x402.appwrite.network/checkout/citeready?domain=${encodeURIComponent(target.hostname)}`,
    },
  };
}

export async function runFullLaunchAudit({ domain, brandName }) {
  const cleanDomain = sanitizeDomain(domain);
  const inferredBrand = brandName ? sanitizeLabel(brandName) : cleanDomain.split(".")[0];

  const [brand, email, geo] = await Promise.all([
    runBrandAudit({ name: inferredBrand, tlds: ["com", "io", "ai", "dev"] }),
    runEmailDeliverabilityAudit({ domain: cleanDomain }),
    runAiSearchVisibilityAudit({ url: `https://${cleanDomain}` }),
  ]);

  const overallScore = Math.round(brand.score * 0.3 + email.score * 0.4 + geo.score * 0.3);
  const overallGrade = overallScore >= 88 ? "A" : overallScore >= 72 ? "B" : overallScore >= 55 ? "C" : "D";
  const prioritizedFixes = [
    ...email.issues.map((i) => `[Email/DNS] ${i}`),
    ...geo.issues.map((i) => `[AI Search/GEO] ${i}`),
    ...brand.issues.map((i) => `[Brand/TM] ${i}`),
  ];

  return {
    checkedAt: new Date().toISOString(),
    domain: cleanDomain,
    brandCandidate: inferredBrand,
    overallScore,
    overallGrade,
    pillars: {
      brandAvailability: { score: brand.score, grade: brand.grade, issuesCount: brand.issues.length },
      emailDeliverability: { score: email.score, grade: email.grade, detectedProvider: email.detectedProvider, spfLookups: email.spf.dnsLookups, dmarcPolicy: email.dmarc.policy },
      aiSearchVisibility: { score: geo.score, grade: geo.grade, hasLlmsTxt: geo.llmsTxt.present, blockedAiBots: geo.aiCrawlers.blockedBots },
    },
    prioritizedFixes,
    details: { brand, email, geo },
    bundleUpgrade: {
      name: "OmniForge 3-in-1 Founder Launch Stack (BrandShield Pro + InboxShield Pro + CiteReady Pro — Save $38)",
      soloPriceUsd: 49,
      agencyPriceUsd: 89,
      freeTools: {
        brandNamerUrl: `https://brand-checker.appwrite.network/namer?q=${encodeURIComponent(inferredBrand)}`,
        spfFlattenerUrl: `https://inbox-checker.appwrite.network/spf-flattener?domain=${encodeURIComponent(cleanDomain)}`,
        llmsGeneratorUrl: `https://citeready-checker.appwrite.network/generator?url=${encodeURIComponent(`https://${cleanDomain}`)}`,
      },
      gumroadUrl: "https://omnipulse-x402.appwrite.network/go/gumroad/launch-stack",
      directCheckoutUrl: `https://omnipulse-x402.appwrite.network/checkout/launch-stack?domain=${encodeURIComponent(cleanDomain)}`,
    },
  };
}
