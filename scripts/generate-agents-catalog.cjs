#!/usr/bin/env node
/**
 * generate-agents-catalog.cjs
 *
 * Reads all agent Markdown files from agents/ directory,
 * extracts YAML front-matter, and generates PHICLAW-AGENTS.md — a workspace
 * bootstrap file that includes orchestration instructions + full agent catalog.
 *
 * This file is loaded AS AN EXTRA BOOTSTRAP FILE (not the main AGENTS.md)
 * to avoid overwriting the user's custom AGENTS.md.
 *
 * Usage:
 *   node scripts/generate-agents-catalog.cjs [output-path]
 *   node scripts/generate-agents-catalog.cjs > PHICLAW-AGENTS.md
 */

const fs = require("fs");
const path = require("path");

const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const AGENTS_DIR = path.resolve(__dirname, "..", "agents");

function findMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(full));
    } else if (
      entry.name.endsWith(".md") &&
      !["README.md", "CONTRIBUTING.md", "EXECUTIVE-BRIEF.md", "QUICKSTART.md"].includes(entry.name)
    ) {
      results.push(full);
    }
  }
  return results;
}

function parseYamlSimple(text) {
  const result = {};
  for (const line of text.split("\n")) {
    const m =
      line.match(/^(\w+):\s*"(.+)"\s*$/) ||
      line.match(/^(\w+):\s*'(.+)'\s*$/) ||
      line.match(/^(\w+):\s*(.+?)\s*$/);
    if (m && m[1] && m[2]) {
      result[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

function formatDivisionName(div) {
  return div
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildCatalog() {
  const files = findMarkdownFiles(AGENTS_DIR).sort();
  const divisions = {};
  let total = 0;

  for (const fp of files) {
    const content = fs.readFileSync(fp, "utf-8");
    const m = content.match(FRONT_MATTER_RE);
    if (!m) continue;
    const meta = parseYamlSimple(m[1]);
    if (!meta.name) continue;

    const rel = path.relative(AGENTS_DIR, fp);
    const parts = rel.split(path.sep);
    const division = parts[0];
    const id = path.basename(fp, ".md");

    if (!divisions[division]) divisions[division] = [];
    divisions[division].push({
      id,
      name: meta.name,
      emoji: meta.emoji || "🤖",
      vibe: meta.vibe || (meta.description || "").slice(0, 100),
    });
    total++;
  }

  // ── Header: Orchestration Protocol ──
  const lines = [];
  lines.push("# PHICLAW-AGENTS.md — PhiClaw Multi-Agent Orchestration");
  lines.push("");
  lines.push(`> **${total} specialized agents** across **${Object.keys(divisions).length} divisions** — powered by PhiClaw`);
  lines.push(">");
  lines.push("> This file is auto-generated from the agents/ directory.");
  lines.push("> Do not edit manually — changes will be overwritten on next boot.");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 🎯 Orchestration Protocol");
  lines.push("");
  lines.push("When handling user requests, follow this process:");
  lines.push("");
  lines.push("### 1. Assess Complexity");
  lines.push("- **Simple** → Answer directly, cite relevant agent if helpful");
  lines.push("- **Moderate** → Read 1-2 agent profiles from `agents/<division>/<id>.md`, apply their methodology");
  lines.push("- **Complex** → Plan multi-agent approach, combine expertise from multiple divisions");
  lines.push("");
  lines.push("### 2. Select Agents");
  lines.push("Scan the registry below. Match the task to the right division(s), then read the agent's full `.md` file for detailed methodology, frameworks, and personality.");
  lines.push("");
  lines.push("### 3. Compose Response");
  lines.push("- Apply each agent's expertise and frameworks");
  lines.push("- For multi-agent responses, structure with clear sections");
  lines.push("- Cite contributing agents: e.g., _(per 🏗️ Backend Architect)_");
  lines.push("- Deliver concrete, actionable output — not generic advice");
  lines.push("");
  lines.push("### 4. Prompt Engineering (automatic)");
  lines.push("When the Prompt Engineer is enabled, raw user requests are automatically transformed:");
  lines.push("1. Intent detection (create/analyze/optimize/fix/plan/research)");
  lines.push("2. Domain classification");
  lines.push("3. Complexity assessment");
  lines.push("4. Agent matching");
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Agent Registry ──
  lines.push("## 📂 Agent Registry");
  lines.push("");

  for (const div of Object.keys(divisions).sort()) {
    const agents = divisions[div];
    lines.push(`### ${formatDivisionName(div)} (${agents.length})`);
    lines.push("");
    for (const a of agents) {
      lines.push(`- ${a.emoji} **${a.name}** (\`${a.id}\`) — ${a.vibe}`);
    }
    lines.push("");
  }

  // ── Commands ──
  lines.push("---");
  lines.push("");
  lines.push("## 🛠️ Commands");
  lines.push("");
  lines.push("| Command | Description |");
  lines.push("|---|---|");
  lines.push("| `/phiagents` | List all divisions with agent counts |");
  lines.push("| `/phiagents <division>` | List agents in a specific division |");
  lines.push("| `/phiagent <name>` | Show full agent profile |");
  lines.push("| `/orchestrate on\\|off` | Toggle orchestrator |");
  lines.push("| `/promptengineer on\\|off` | Toggle prompt engineer |");
  lines.push("");

  // ── Strategy ──
  lines.push("## 📋 Strategy & Playbooks");
  lines.push("");
  lines.push("For complex multi-phase projects, consult `agents/strategy/`:");
  lines.push("- **NEXUS** — Multi-agent orchestration playbook");
  lines.push("- **Phases 0-6** — Discovery → Strategy → Foundation → Build → Hardening → Launch → Operate");
  lines.push("- **Runbooks** — Startup MVP, Enterprise Feature, Incident Response, Marketing Campaign");

  return lines.join("\n");
}

// Main
const catalog = buildCatalog();
const outputPath = process.argv[2];

if (outputPath) {
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, catalog + "\n", "utf-8");
  console.log(`[generate-agents-catalog] Written ${catalog.length} bytes to ${outputPath}`);
} else {
  process.stdout.write(catalog + "\n");
}
