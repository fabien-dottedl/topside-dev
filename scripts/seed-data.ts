import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STREAMS_DIR = join(homedir(), ".streams");

const TODAY = new Date("2026-03-12T09:00:00.000Z");

function daysAgo(n: number): Date {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date(TODAY);
  d.setUTCHours(d.getUTCHours() - n);
  return d;
}

function iso(d: Date): string {
  return d.toISOString();
}

let createdCount = 0;

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function write(relativePath: string, content: string): Promise<void> {
  const fullPath = join(STREAMS_DIR, relativePath);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await ensureDir(dir);
  await writeFile(fullPath, content, "utf-8");
  createdCount++;
  console.log(`  created ${relativePath}`);
}

// ---------------------------------------------------------------------------
// 1. config.json
// ---------------------------------------------------------------------------

async function seedConfig(): Promise<void> {
  console.log("\n[config]");
  await write(
    "config.json",
    JSON.stringify(
      {
        github: { token: "ghp_placeholder_token_replace_me" },
        repos: [
          "acme-corp/api-gateway",
          "acme-corp/web-dashboard",
          "acme-corp/shared-utils",
        ],
      },
      null,
      2
    ) + "\n"
  );
}

// ---------------------------------------------------------------------------
// 2. day-plan.md
// ---------------------------------------------------------------------------

async function seedDayPlan(): Promise<void> {
  console.log("\n[day-plan]");
  await write(
    "day-plan.md",
    `# Day Plan — 2026-03-12

## Goals
- [x] Review RBAC PR and address feedback
- [x] Fix Bedrock SCP timeout issue
- [ ] Spike TipTap editor integration for notes
- [ ] Set up New Relic alerting for API gateway
- [ ] Draft webhook system RFC
- [ ] Catch up on GitHub notifications

## Notes
Standup at 10am. Deploy window 2-4pm.
`
  );
}

// ---------------------------------------------------------------------------
// 3. active/feat-rbac-v2/
// ---------------------------------------------------------------------------

async function seedFeatRbac(): Promise<void> {
  console.log("\n[active/feat-rbac-v2]");
  const base = "active/feat-rbac-v2";

  await write(
    `${base}/stream.json`,
    JSON.stringify(
      {
        id: "feat-rbac-v2",
        title: "RBAC V2 — Role-Based Access Control",
        status: "active",
        created: iso(daysAgo(1)),
        repo: "acme-corp/api-gateway",
        branch: "feat/rbac-v2",
        worktree: "~/worktrees/api-gateway-rbac",
      },
      null,
      2
    ) + "\n"
  );

  await write(
    `${base}/scope.md`,
    `# RBAC V2 — Role-Based Access Control

## Overview
Implement a full role-based access control system for the API gateway,
replacing the existing binary admin/user model with granular permissions.

## Requirements

### Permission Model
- Define permissions as \`resource:action\` pairs (e.g. \`projects:read\`, \`billing:write\`)
- Support wildcard permissions (\`projects:*\`)
- Roles aggregate permissions: \`admin\`, \`editor\`, \`viewer\`, \`billing-admin\`
- Users can hold multiple roles

### Middleware
- Express middleware that reads the user's roles from the JWT
- Checks required permissions against the role-permission map
- Returns 403 with structured error when denied
- Caches resolved permissions per request

### Database Migration
- New \`roles\` table: id, name, description, created_at
- New \`role_permissions\` table: role_id, permission (string)
- New \`user_roles\` table: user_id, role_id, granted_at, granted_by
- Seed default roles on migration

### Tests
- Unit tests for permission resolution logic
- Integration tests for middleware (allowed / denied / missing token)
- Migration rollback test
`
  );

  const events = [
    { type: "stream_created", timestamp: iso(daysAgo(1)), message: "Stream created for RBAC V2 feature" },
    { type: "scope_defined", timestamp: iso(hoursAgo(22)), message: "Scope defined: permission model, middleware, migration, tests" },
    { type: "checkpoint", timestamp: iso(hoursAgo(18)), message: "Permission model design complete — using resource:action pattern" },
    { type: "code_change", timestamp: iso(hoursAgo(6)), message: "Implemented RBAC middleware and role-permission resolver" },
    { type: "code_change", timestamp: iso(hoursAgo(4)), message: "Added database migration for roles, role_permissions, and user_roles tables" },
    { type: "pr_opened", timestamp: iso(hoursAgo(2)), message: "Opened PR #142: feat: add RBAC middleware" },
  ];
  await write(`${base}/events.jsonl`, events.map((e) => JSON.stringify(e)).join("\n") + "\n");

  await write(
    `${base}/notes.md`,
    `# Implementation Notes — RBAC V2

## 2026-03-11

- Decided on \`resource:action\` pattern over bitfield approach — more readable,
  easier to extend without migration.
- Wildcard support means we can do \`projects:*\` for full access without listing
  every action.
- JWT will carry role names, not permissions — keeps token small. Permissions
  resolved server-side from cached role map.

## 2026-03-12

- PR opened. Reviewer asked about cache invalidation when roles change.
  Added a \`role_version\` counter that bumps on writes — middleware checks version
  before using cached permissions.
- Need to coordinate with frontend team on 403 error shape so the dashboard
  can show contextual "request access" UI.
`
  );
}

// ---------------------------------------------------------------------------
// 4. active/fix-bedrock-scp/
// ---------------------------------------------------------------------------

async function seedFixBedrock(): Promise<void> {
  console.log("\n[active/fix-bedrock-scp]");
  const base = "active/fix-bedrock-scp";

  await write(
    `${base}/stream.json`,
    JSON.stringify(
      {
        id: "fix-bedrock-scp",
        title: "Fix Bedrock SCP Timeout in eu-west-1",
        status: "waiting",
        created: iso(daysAgo(2)),
        repo: "acme-corp/api-gateway",
        branch: "fix/bedrock-scp-timeout",
        worktree: "~/worktrees/api-gateway-scp",
      },
      null,
      2
    ) + "\n"
  );

  await write(
    `${base}/scope.md`,
    `# Fix Bedrock SCP Timeout

## Problem
Bedrock inference calls in eu-west-1 are timing out after 30 seconds when
an AWS Organization SCP (Service Control Policy) is evaluated. The SCP
\`RestrictBedrockModels\` adds ~8 s of latency per call, pushing some
requests past the gateway's 30 s timeout.

## Plan
1. Increase gateway timeout to 60 s for Bedrock routes only
2. Add retry with exponential backoff (max 2 retries)
3. Cache SCP evaluation result for 5 minutes (per principal)
4. Add CloudWatch metric for SCP evaluation latency
5. Coordinate with platform team on SCP policy optimization
`
  );

  const events = [
    { type: "stream_created", timestamp: iso(daysAgo(2)), message: "Stream created to investigate Bedrock SCP timeout" },
    { type: "scope_defined", timestamp: iso(daysAgo(2)), message: "Root cause identified: SCP RestrictBedrockModels adds ~8s latency" },
    { type: "checkpoint", timestamp: iso(daysAgo(1)), message: "Gateway timeout increased to 60s for Bedrock routes. Retry logic added." },
    { type: "blocked", timestamp: iso(hoursAgo(5)), message: "Waiting on platform team to confirm SCP policy change timeline — cannot fully validate fix until SCP is updated" },
  ];
  await write(`${base}/events.jsonl`, events.map((e) => JSON.stringify(e)).join("\n") + "\n");

  await write(
    `${base}/notes.md`,
    `# Notes — Bedrock SCP Timeout

## 2026-03-10
- Reproduced timeout in eu-west-1 staging. Confirmed SCP evaluation adds 6-9s.
- us-east-1 is unaffected (different OU, no Bedrock SCP).

## 2026-03-11
- Bumped Bedrock route timeout to 60s. Added retry with backoff.
- Opened issue for platform team to optimize SCP evaluation (#156).

## 2026-03-12
- Still waiting on platform team response. Pinged in Slack.
- Temporary mitigation (timeout bump) is deployed to staging.
`
  );
}

// ---------------------------------------------------------------------------
// 5. active/spike-tiptap-editor/
// ---------------------------------------------------------------------------

async function seedSpikeTiptap(): Promise<void> {
  console.log("\n[active/spike-tiptap-editor]");
  const base = "active/spike-tiptap-editor";

  await write(
    `${base}/stream.json`,
    JSON.stringify(
      {
        id: "spike-tiptap-editor",
        title: "Spike: TipTap Editor Integration for Notes",
        status: "active",
        created: iso(hoursAgo(1)),
        repo: "acme-corp/web-dashboard",
        branch: "spike/tiptap-editor",
        worktree: "~/worktrees/web-dashboard-tiptap",
      },
      null,
      2
    ) + "\n"
  );

  await write(
    `${base}/scope.md`,
    `# Spike: TipTap Editor Integration

## Goal
Evaluate TipTap as a rich-text / markdown editor for the notes feature
in the web dashboard. Currently using a plain textarea.

## Questions to Answer
- Can TipTap render existing markdown notes without data loss?
- What's the bundle size impact?
- How does it handle collaborative editing (future requirement)?
- Licensing: is the open-source version sufficient?
`
  );

  const events = [
    { type: "stream_created", timestamp: iso(hoursAgo(1)), message: "Started spike to evaluate TipTap editor" },
    { type: "checkpoint", timestamp: iso(TODAY), message: "Installed @tiptap/react and @tiptap/starter-kit — basic editor rendering" },
  ];
  await write(`${base}/events.jsonl`, events.map((e) => JSON.stringify(e)).join("\n") + "\n");
}

// ---------------------------------------------------------------------------
// 6. completed/setup-new-relic/
// ---------------------------------------------------------------------------

async function seedCompletedNewRelic(): Promise<void> {
  console.log("\n[completed/setup-new-relic]");
  const base = "completed/setup-new-relic";

  await write(
    `${base}/stream.json`,
    JSON.stringify(
      {
        id: "setup-new-relic",
        title: "Set Up New Relic Monitoring for API Gateway",
        status: "completed",
        created: iso(daysAgo(5)),
        completedAt: iso(daysAgo(1)),
        repo: "acme-corp/api-gateway",
        branch: "chore/new-relic-setup",
      },
      null,
      2
    ) + "\n"
  );

  await write(
    `${base}/scope.md`,
    `# Set Up New Relic Monitoring

## Overview
Instrument the API gateway with New Relic APM for request tracing,
error tracking, and performance dashboards.

## Tasks
- [x] Install \`newrelic\` npm package and configure agent
- [x] Add custom attributes for tenant ID and request source
- [x] Create dashboards: request latency p50/p95/p99, error rate, throughput
- [x] Set up alert policies: error rate > 5%, p99 > 2s, throughput drop > 30%
- [x] Document runbook for alert triage
`
  );

  const events = [
    { type: "stream_created", timestamp: iso(daysAgo(5)), message: "Stream created for New Relic setup" },
    { type: "scope_defined", timestamp: iso(daysAgo(5)), message: "Scope: APM agent, custom attributes, dashboards, alerts, runbook" },
    { type: "checkpoint", timestamp: iso(daysAgo(4)), message: "New Relic agent installed and reporting to staging" },
    { type: "checkpoint", timestamp: iso(daysAgo(3)), message: "Custom attributes added for tenant ID and request source" },
    { type: "code_change", timestamp: iso(daysAgo(2)), message: "Dashboards created: latency, error rate, throughput" },
    { type: "checkpoint", timestamp: iso(daysAgo(2)), message: "Alert policies configured and tested with synthetic failures" },
    { type: "code_change", timestamp: iso(daysAgo(1)), message: "Runbook documented and linked from alert policies" },
    { type: "completed", timestamp: iso(daysAgo(1)), message: "New Relic setup complete — merged to main and deployed" },
  ];
  await write(`${base}/events.jsonl`, events.map((e) => JSON.stringify(e)).join("\n") + "\n");
}

// ---------------------------------------------------------------------------
// 7. ideas/
// ---------------------------------------------------------------------------

async function seedIdeas(): Promise<void> {
  console.log("\n[ideas]");

  await write(
    "ideas/webhook-system.md",
    `---
title: "Webhook System"
status: draft
priority: high
created: "2026-03-10"
---

# Webhook System

## Motivation
Customers need real-time notifications when resources change. Currently they
poll our API, which is inefficient and adds load.

## High-Level Design
- Webhook registration API: subscribe to event types per resource
- Event fan-out via SQS + Lambda
- Retry with exponential backoff (max 5 attempts)
- Signature verification (HMAC-SHA256)
- Dashboard for delivery status and manual retry

## Open Questions
- Should we support filtering by resource fields (e.g., only status=failed)?
- Rate limiting strategy per endpoint?
`
  );

  await write(
    "ideas/nestd-booking-engine.md",
    `---
title: "Nestd Booking Engine"
status: exploring
priority: medium
created: "2026-03-08"
---

# Nestd Booking Engine

## Context
The current booking flow is tightly coupled to the monolith. Extracting it
into a standalone service would let us iterate faster and support new
property types.

## Ideas
- Event-sourced availability model
- Separate read/write paths (CQRS)
- Calendar sync via iCal protocol
- Multi-currency support from day one
`
  );

  await write(
    "ideas/contract-agent-v2.md",
    `---
title: "Contract Agent V2"
status: draft
priority: low
created: "2026-03-05"
---

# Contract Agent V2

## Background
The current contract review agent handles simple lease agreements but
struggles with complex commercial contracts. V2 should support:

- Multi-party agreements
- Clause extraction and risk scoring
- Comparison against template library
- Integration with DocuSign for execution

## Notes
Low priority — revisit after webhook system ships.
`
  );
}

// ---------------------------------------------------------------------------
// 8. notes/
// ---------------------------------------------------------------------------

async function seedNotes(): Promise<void> {
  console.log("\n[notes]");

  await write(
    "notes/2026-03-11.md",
    `# Notes — 2026-03-11

## Standup
- RBAC PR in review — Jamie had questions about cache invalidation
- Bedrock SCP fix deployed to staging, waiting on platform team
- New Relic setup merged and deployed

## Debugging
Spent ~2 hours tracing the Bedrock timeout. The SCP evaluation is
synchronous and happens before the Bedrock API call is forwarded.
CloudTrail confirmed the \`RestrictBedrockModels\` policy adds 6-9 seconds.

## End of Day
- RBAC feedback addressed, pushed new commit
- Drafted webhook system idea doc
- Tomorrow: start TipTap spike, follow up on SCP timeline
`
  );

  await write(
    "notes/2026-03-12.md",
    `# Notes — 2026-03-12

## Morning
- Reviewed overnight CI results — all green
- RBAC PR approved, merging after deploy window
- Starting TipTap spike this morning
`
  );
}

// ---------------------------------------------------------------------------
// 9. archive/plans/
// ---------------------------------------------------------------------------

async function seedArchive(): Promise<void> {
  console.log("\n[archive]");

  await write(
    "archive/plans/2026-03-11.md",
    `# Day Plan — 2026-03-11

## Goals
- [x] Address RBAC PR review feedback
- [x] Deploy Bedrock timeout fix to staging
- [x] Finish New Relic dashboards and alert policies
- [x] Write runbook for New Relic alerts
- [ ] Start TipTap spike (pushed to tomorrow)

## Notes
Deploy went smoothly. New Relic dashboards look good — already caught a
latency spike in the billing endpoint that we hadn't noticed before.
`
  );
}

// ---------------------------------------------------------------------------
// 10. github/notifications.json
// ---------------------------------------------------------------------------

async function seedGithubNotifications(): Promise<void> {
  console.log("\n[github]");

  const notifications = [
    {
      id: "1",
      type: "PullRequest",
      repo: "acme-corp/api-gateway",
      title: "feat: add RBAC middleware",
      url: "https://github.com/acme-corp/api-gateway/pull/142",
      reason: "review_requested",
      unread: true,
      updated_at: iso(hoursAgo(2)),
    },
    {
      id: "2",
      type: "Issue",
      repo: "acme-corp/web-dashboard",
      title: "Dashboard crashes on empty state",
      url: "https://github.com/acme-corp/web-dashboard/issues/89",
      reason: "assign",
      unread: true,
      updated_at: iso(hoursAgo(3)),
    },
    {
      id: "3",
      type: "PullRequest",
      repo: "acme-corp/shared-utils",
      title: "chore: bump deps",
      url: "https://github.com/acme-corp/shared-utils/pull/31",
      reason: "mention",
      unread: false,
      updated_at: iso(daysAgo(1)),
    },
    {
      id: "4",
      type: "Issue",
      repo: "acme-corp/api-gateway",
      title: "SCP policy timeout in eu-west-1",
      url: "https://github.com/acme-corp/api-gateway/issues/156",
      reason: "author",
      unread: true,
      updated_at: iso(hoursAgo(5)),
    },
    {
      id: "5",
      type: "PullRequest",
      repo: "acme-corp/web-dashboard",
      title: "fix: handle null user in sidebar",
      url: "https://github.com/acme-corp/web-dashboard/pull/88",
      reason: "comment",
      unread: false,
      updated_at: iso(daysAgo(2)),
    },
  ];

  await write(
    "github/notifications.json",
    JSON.stringify(notifications, null, 2) + "\n"
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const clean = process.argv.includes("--clean");

  console.log("Topside seed-data script");
  console.log(`  target: ${STREAMS_DIR}`);
  console.log(`  clean:  ${clean}`);

  if (clean) {
    console.log("\nRemoving existing ~/.streams/ ...");
    await rm(STREAMS_DIR, { recursive: true, force: true });
  }

  await ensureDir(STREAMS_DIR);

  await seedConfig();
  await seedDayPlan();
  await seedFeatRbac();
  await seedFixBedrock();
  await seedSpikeTiptap();
  await seedCompletedNewRelic();
  await seedIdeas();
  await seedNotes();
  await seedArchive();
  await seedGithubNotifications();

  console.log(`\nDone — ${createdCount} files created.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
