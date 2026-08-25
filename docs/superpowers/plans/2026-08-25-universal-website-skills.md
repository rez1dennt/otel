# Universal Website Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create, validate, version, and install three reusable personal Codex skills for building, visually polishing, and releasing HTML/CSS/JavaScript websites with optional WordPress handoff.

**Architecture:** Keep canonical skill sources under `tools/codex-skills/` in the repository, validate them with one deterministic Node.js harness, and install exact copies into the current user’s official `$HOME/.agents/skills` location. Each skill owns one workflow, uses progressive disclosure through focused references, and contains realistic eval prompts; project-specific content stays outside the global skills.

**Tech Stack:** Markdown/YAML skill files, JSON eval fixtures, Node.js ES modules, PowerShell installation, Codex personal skills, optional Playwright in target website projects.

## Global Constraints

- Primary target stack: semantic HTML5, CSS and vanilla JavaScript; no framework is assumed.
- WordPress is an optional handoff mode and must not activate for an ordinary static-site task.
- Reliability takes priority over an artificial line or token limit.
- Progressive disclosure may reduce context use only when it does not omit required behavior.
- Header is fixed at the top on every page and must not shift during scrolling, menu transitions, or scroll locking.
- Burger menus, modals, FAQ and Cookie panels must open and close smoothly without changing the page scroll position or layout width.
- Browser validation must include desktop, an intermediate width, `360px`, and `320px` when the task affects layout or release readiness.
- Do not invent client facts, results, testimonials, prices, legal details, social links, endpoints, analytics identifiers, or domains.
- Before claiming completion, use fresh evidence from applicable tests and browser checks.
- Preserve unrelated user changes and never use destructive Git commands or force push.
- Source specification: `docs/superpowers/specs/2026-08-25-universal-website-skills-design.md`.
- Official personal installation location: `$HOME/.agents/skills`.

---

## File map

### Shared tooling

- Create `tools/codex-skills/scripts/validate-skills.mjs` — validates skill structure, metadata, bundled references, UI metadata and eval fixtures.
- Create `tools/codex-skills/install-skills.ps1` — copies the three validated skills to a supplied destination, defaulting to `$HOME/.agents/skills`.
- Create `tools/codex-skills/README.md` — documents names, explicit invocation, implicit triggering, validation and installation.

### `website-build-workflow`

- Create `tools/codex-skills/website-build-workflow/SKILL.md` — routing and end-to-end build workflow.
- Create `tools/codex-skills/website-build-workflow/references/project-intake.md` — source triage, facts, missing client information and project mapping.
- Create `tools/codex-skills/website-build-workflow/references/static-site-architecture.md` — HTML/CSS/JS structure, tokens, components, accessibility and image handling.
- Create `tools/codex-skills/website-build-workflow/references/seo-wordpress-handoff.md` — SEO baseline, clean URLs and optional WordPress templates/fields.
- Create `tools/codex-skills/website-build-workflow/agents/openai.yaml` — display metadata and implicit invocation policy.
- Create `tools/codex-skills/website-build-workflow/evals/evals.json` — build workflow tests.

### `website-visual-polish`

- Create `tools/codex-skills/website-visual-polish/SKILL.md` — routing and visual correction workflow.
- Create `tools/codex-skills/website-visual-polish/references/responsive-visual-contract.md` — viewport, spacing, card, media and typography rules.
- Create `tools/codex-skills/website-visual-polish/references/stable-interactions.md` — fixed header, burger, modal, FAQ, Cookie and motion rules.
- Create `tools/codex-skills/website-visual-polish/agents/openai.yaml` — display metadata and implicit invocation policy.
- Create `tools/codex-skills/website-visual-polish/evals/evals.json` — visual workflow tests.

### `website-release-qa`

- Create `tools/codex-skills/website-release-qa/SKILL.md` — release gate and evidence rules.
- Create `tools/codex-skills/website-release-qa/references/browser-release-checklist.md` — route matrix and interaction checks.
- Create `tools/codex-skills/website-release-qa/references/git-handoff.md` — safe commit/push verification and reporting.
- Create `tools/codex-skills/website-release-qa/agents/openai.yaml` — display metadata and implicit invocation policy.
- Create `tools/codex-skills/website-release-qa/evals/evals.json` — release workflow tests.

---

### Task 1: Deterministic skill validation harness

**Files:**
- Create: `tools/codex-skills/scripts/validate-skills.mjs`

**Interfaces:**
- Consumes: zero or more skill directory names from `process.argv`; defaults to all three canonical names.
- Produces: exit code `0` with `Validated N skill(s).` or exit code `1` with one error per failed invariant.

- [ ] **Step 1: Write the validator before any skill exists**

Create `tools/codex-skills/scripts/validate-skills.mjs` with this implementation:

```js
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEFAULT_SKILLS = [
  'website-build-workflow',
  'website-visual-polish',
  'website-release-qa'
];

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error('SKILL.md has no valid YAML frontmatter');
  const name = match[1].match(/^name:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)?.[1]?.trim();
  const description = match[1].match(/^description:\s*['"]?([\s\S]*?)['"]?\s*$/m)?.[1]?.trim();
  return { name, description };
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function validateSkill(skillName) {
  const directory = path.join(ROOT, skillName);
  const skillFile = path.join(directory, 'SKILL.md');
  if (!(await exists(skillFile))) throw new Error(`${skillName}: SKILL.md not found`);

  const markdown = await readFile(skillFile, 'utf8');
  const meta = frontmatter(markdown);
  if (meta.name !== skillName) throw new Error(`${skillName}: frontmatter name mismatch`);
  if (!meta.description || meta.description.length < 120) {
    throw new Error(`${skillName}: description is too short for reliable triggering`);
  }
  if (/\b(?:TBD|TODO|PLACEHOLDER)\b/i.test(markdown)) {
    throw new Error(`${skillName}: unresolved placeholder in SKILL.md`);
  }

  const references = [...markdown.matchAll(/references\/([a-z0-9-]+\.md)/g)].map((match) => match[1]);
  if (references.length === 0) throw new Error(`${skillName}: no progressive-disclosure references`);
  for (const reference of new Set(references)) {
    if (!(await exists(path.join(directory, 'references', reference)))) {
      throw new Error(`${skillName}: missing reference ${reference}`);
    }
  }

  const evalFile = path.join(directory, 'evals', 'evals.json');
  const evals = JSON.parse(await readFile(evalFile, 'utf8'));
  if (evals.skill_name !== skillName) throw new Error(`${skillName}: eval skill_name mismatch`);
  if (!Array.isArray(evals.evals) || evals.evals.length < 3) {
    throw new Error(`${skillName}: at least three evals are required`);
  }
  for (const item of evals.evals) {
    if (!Number.isInteger(item.id) || !item.prompt || !item.expected_output) {
      throw new Error(`${skillName}: malformed eval ${item.id ?? 'unknown'}`);
    }
    if (!Array.isArray(item.expectations) || item.expectations.length < 3) {
      throw new Error(`${skillName}: eval ${item.id} needs at least three expectations`);
    }
  }

  const ui = await readFile(path.join(directory, 'agents', 'openai.yaml'), 'utf8');
  for (const field of ['display_name:', 'short_description:', 'default_prompt:', 'allow_implicit_invocation: true']) {
    if (!ui.includes(field)) throw new Error(`${skillName}: openai.yaml missing ${field}`);
  }
}

const requested = process.argv.slice(2);
const skills = requested.length > 0 ? requested : DEFAULT_SKILLS;
const errors = [];
for (const skill of skills) {
  try {
    await validateSkill(skill);
  } catch (error) {
    errors.push(error.message);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${skills.length} skill(s).`);
```

- [ ] **Step 2: Run the validator and verify the red state**

Run:

```powershell
node tools/codex-skills/scripts/validate-skills.mjs
```

Expected: exit code `1` and three `SKILL.md not found` messages.

- [ ] **Step 3: Commit the validation harness**

```powershell
git add tools/codex-skills/scripts/validate-skills.mjs
git commit -m "test: add website skill validator"
```

---

### Task 2: Create `website-build-workflow`

**Files:**
- Create: `tools/codex-skills/website-build-workflow/SKILL.md`
- Create: `tools/codex-skills/website-build-workflow/references/project-intake.md`
- Create: `tools/codex-skills/website-build-workflow/references/static-site-architecture.md`
- Create: `tools/codex-skills/website-build-workflow/references/seo-wordpress-handoff.md`
- Create: `tools/codex-skills/website-build-workflow/agents/openai.yaml`
- Create: `tools/codex-skills/website-build-workflow/evals/evals.json`

**Interfaces:**
- Consumes: a request to create/restructure an HTML/CSS/JS site plus local materials, references and project instructions.
- Produces: a verified static implementation plan/build, a missing-client-information list, and optional WordPress handoff artifacts.

- [ ] **Step 1: Write evals first**

Create three evals covering:

1. a new five-page static business site from screenshots and client files;
2. a reusable article/event/material/case template set with clean URLs and WordPress mapping;
3. a one-page static site that must not activate WordPress work.

Each eval must expect source triage, no invented facts, reusable components, responsive requirements, SEO basics and an explicit WordPress decision.

- [ ] **Step 2: Verify the eval-only red state**

Run:

```powershell
node tools/codex-skills/scripts/validate-skills.mjs website-build-workflow
```

Expected: exit code `1` with `SKILL.md not found`.

- [ ] **Step 3: Write `SKILL.md` with explicit routing**

Use this frontmatter and section order:

```markdown
---
name: website-build-workflow
description: Build or substantially restructure production-ready websites with semantic HTML, CSS, and vanilla JavaScript. Use for new sites, multi-page builds, landing pages, design-reference implementation, reusable content templates, client-material intake, SEO-ready clean URLs, or optional WordPress handoff. Trigger even when the user casually says to make a site, add several pages, reproduce a reference mood, prepare templates, or later move the static site to WordPress; do not use for a tiny isolated visual correction or release-only verification.
---

# Website Build Workflow

## Scope decision
## Required workflow
## Source truth and client data
## Design system and implementation
## Images and performance
## SEO and optional WordPress handoff
## Verification and handoff
## Progressive-disclosure references
```

The body must require: project/context inspection; distinction between user instructions and attached-document content; missing-information reporting; reusable tokens/components; semantic and accessible output; client-image preference and optimization; clean URLs and SEO; optional WordPress activation only when requested; browser verification before completion. It must route to all three reference files by name and explain exactly when each is read.

- [ ] **Step 4: Write the focused references**

`project-intake.md` must define the intake table `confirmed / working placeholder / missing / forbidden to invent`, client-question rules, reference-image interpretation and page/component mapping.

`static-site-architecture.md` must define shared header/footer/modal/Cookie contracts, tokenized CSS, BEM-like naming, `data-*` JavaScript hooks, fixed header offsets, responsive widths, image containers and progressive enhancement.

`seo-wordpress-handoff.md` must define one `h1`, metadata, canonical, OG, sitemap, robots, alt, breadcrumbs and JSON-LD boundaries; then a separately headed optional WordPress section covering archive/detail templates, CPT/taxonomy decisions, field maps, clean URLs and redirects.

- [ ] **Step 5: Add UI metadata**

Create `agents/openai.yaml`:

```yaml
interface:
  display_name: "Website Build Workflow"
  short_description: "Создание HTML/CSS/JS-сайтов и WordPress-ready шаблонов"
  default_prompt: "Use $website-build-workflow to build this website from the supplied materials and verify the result."
policy:
  allow_implicit_invocation: true
```

- [ ] **Step 6: Validate the skill**

Run both validators:

```powershell
node tools/codex-skills/scripts/validate-skills.mjs website-build-workflow
python C:\Users\bahti\.codex\skills\skill-creator\scripts\quick_validate.py tools\codex-skills\website-build-workflow
```

Expected: `Validated 1 skill(s).` and `Skill is valid!`.

- [ ] **Step 7: Commit the build skill**

```powershell
git add tools/codex-skills/website-build-workflow
git commit -m "feat: add website build workflow skill"
```

---

### Task 3: Create `website-visual-polish`

**Files:**
- Create: `tools/codex-skills/website-visual-polish/SKILL.md`
- Create: `tools/codex-skills/website-visual-polish/references/responsive-visual-contract.md`
- Create: `tools/codex-skills/website-visual-polish/references/stable-interactions.md`
- Create: `tools/codex-skills/website-visual-polish/agents/openai.yaml`
- Create: `tools/codex-skills/website-visual-polish/evals/evals.json`

**Interfaces:**
- Consumes: screenshots, visual feedback, responsive defects or a request to polish an existing site.
- Produces: root-cause-driven visual corrections with desktop/mobile screenshots and measured DOM geometry.

- [ ] **Step 1: Write evals first**

Create at least these evals:

1. a fixed mobile header whose burger jumps and opens abruptly;
2. cards with uneven actions, cramped copy and empty image-frame tails;
3. a full-site `320px`/`360px` audit with oversized headings and excessive section gaps.

Expectations must explicitly cover fixed header stability, scroll restoration, smooth opening and closing, left-aligned mobile headings, no horizontal overflow, compact rhythm, stable hover geometry and screenshot/DOM evidence.

- [ ] **Step 2: Verify the eval-only red state**

```powershell
node tools/codex-skills/scripts/validate-skills.mjs website-visual-polish
```

Expected: exit code `1` with `SKILL.md not found`.

- [ ] **Step 3: Write `SKILL.md` with explicit routing**

Use this frontmatter:

```markdown
---
name: website-visual-polish
description: Diagnose and polish visual, responsive, and interaction defects in existing websites. Use whenever the user supplies UI screenshots or reports cramped content, giant gaps, misaligned cards, oversized mobile type, unclear buttons, image-frame gaps, broken hover states, horizontal overflow, a jumping fixed header, abrupt burger menus, modal scroll jumps, Cookie/FAQ layout problems, or asks to check the site down to 320–360px. Do not use as the primary workflow for a brand-new multi-page build or for release-only Git verification.
---
```

The body must require root-cause diagnosis before CSS changes; target-width selection; fixed-header stability; smooth two-way transitions; preserved scrollbar width, scroll position and focus; compact spacing; stable card geometry; image fill; touch/focus/reduced-motion states; screenshots and computed DOM measurements after implementation.

- [ ] **Step 4: Write visual references**

`responsive-visual-contract.md` must define checks for `1280px`, an intermediate viewport, `360px` and `320px`; gutters, left axes, typography, section rhythm, cards, actions, media frames, buttons, overflow and content density.

`stable-interactions.md` must define the fixed-header layer/offset contract and state machines for burger, modal, FAQ and Cookie panels, including opening/closing classes, transition-end handling, Escape, focus return, body scroll lock, scrollbar compensation and `prefers-reduced-motion`.

- [ ] **Step 5: Add UI metadata**

```yaml
interface:
  display_name: "Website Visual Polish"
  short_description: "Адаптив, карточки, header и плавные интерфейсы без прыжков"
  default_prompt: "Use $website-visual-polish to diagnose these visual problems, fix their root causes, and verify the target viewports."
policy:
  allow_implicit_invocation: true
```

- [ ] **Step 6: Validate and commit**

```powershell
node tools/codex-skills/scripts/validate-skills.mjs website-visual-polish
python C:\Users\bahti\.codex\skills\skill-creator\scripts\quick_validate.py tools\codex-skills\website-visual-polish
git add tools/codex-skills/website-visual-polish
git commit -m "feat: add website visual polish skill"
```

Expected: both validators pass before the commit.

---

### Task 4: Create `website-release-qa`

**Files:**
- Create: `tools/codex-skills/website-release-qa/SKILL.md`
- Create: `tools/codex-skills/website-release-qa/references/browser-release-checklist.md`
- Create: `tools/codex-skills/website-release-qa/references/git-handoff.md`
- Create: `tools/codex-skills/website-release-qa/agents/openai.yaml`
- Create: `tools/codex-skills/website-release-qa/evals/evals.json`

**Interfaces:**
- Consumes: an implemented website and a request to finish, present, commit, publish or push it.
- Produces: fresh test/browser evidence, fixed blocking defects, and a truthful Git/publish handoff.

- [ ] **Step 1: Write evals first**

Create at least these evals:

1. “запушь всё в main” with an existing Playwright suite and dirty worktree;
2. “сайт уже можно показывать клиенту?” with no browser tests configured;
3. a failed mobile modal/menu test that must be fixed and fully rerun before completion.

Expectations must cover fresh tests, `git diff --check`, preservation of unrelated changes, all public routes, `1280/768/360/320`, console/link/resource checks, interactions, SEO/legal checks, no force push and truthful branch/commit reporting.

- [ ] **Step 2: Verify the eval-only red state**

```powershell
node tools/codex-skills/scripts/validate-skills.mjs website-release-qa
```

Expected: exit code `1` with `SKILL.md not found`.

- [ ] **Step 3: Write `SKILL.md` with an evidence gate**

Use this frontmatter:

```markdown
---
name: website-release-qa
description: Run the final evidence-based quality gate for an HTML/CSS/JavaScript website before declaring it ready, presenting it to a client, committing, publishing, or pushing to Git. Trigger on phrases such as “готово?”, “можно показывать?”, “проверь весь сайт”, “запушь всё”, “залей в main”, “релиз” or “публикуй”. Verify tests, Playwright/browser flows, all routes, 1280/768/360/320 layouts, fixed-header/menu/modal/Cookie behavior, links, assets, console, SEO/legal files, Git diff and the actual push result; do not use as the primary design or build workflow.
---
```

The body must require discovery of project commands and public routes; fresh automated and browser checks; local Playwright setup only when needed and absent; blocking defect repair followed by full rerun; honest unverified-item reporting; safe Git behavior; and a concise evidence report.

- [ ] **Step 4: Write release references**

`browser-release-checklist.md` must define route discovery, viewport matrix, horizontal-overflow checks, header/anchor checks, burger/modal/FAQ/Cookie/form flows, focus/scroll restoration, console/network failures, images, metadata and legal links.

`git-handoff.md` must define dirty-tree handling, `git diff --check`, test evidence freshness, staging only task files, branch/remote verification, non-force push, post-push commit verification and the final report format.

- [ ] **Step 5: Add UI metadata**

```yaml
interface:
  display_name: "Website Release QA"
  short_description: "Финальная проверка сайта перед показом, commit и push"
  default_prompt: "Use $website-release-qa to verify this website with fresh evidence before declaring it ready or pushing it."
policy:
  allow_implicit_invocation: true
```

- [ ] **Step 6: Validate and commit**

```powershell
node tools/codex-skills/scripts/validate-skills.mjs website-release-qa
python C:\Users\bahti\.codex\skills\skill-creator\scripts\quick_validate.py tools\codex-skills\website-release-qa
git add tools/codex-skills/website-release-qa
git commit -m "feat: add website release QA skill"
```

Expected: both validators pass before the commit.

---

### Task 5: Document and test personal installation

**Files:**
- Create: `tools/codex-skills/install-skills.ps1`
- Create: `tools/codex-skills/README.md`

**Interfaces:**
- Consumes: canonical skill directories and optional `-Destination`.
- Produces: installed copies under the destination, defaulting to `<UserProfile>/.agents/skills`.

- [ ] **Step 1: Write the installer**

Create `install-skills.ps1`:

```powershell
param(
    [string]$Destination = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.agents\skills')
)

$ErrorActionPreference = 'Stop'
$skillNames = @(
    'website-build-workflow',
    'website-visual-polish',
    'website-release-qa'
)

New-Item -ItemType Directory -Force -Path $Destination | Out-Null
foreach ($skillName in $skillNames) {
    $source = Join-Path $PSScriptRoot $skillName
    $target = Join-Path $Destination $skillName
    if (-not (Test-Path -LiteralPath (Join-Path $source 'SKILL.md'))) {
        throw "Invalid skill source: $source"
    }
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item -LiteralPath (Join-Path $source 'SKILL.md') -Destination $target -Force
    foreach ($folder in @('references', 'agents', 'evals')) {
        $sourceFolder = Join-Path $source $folder
        if (Test-Path -LiteralPath $sourceFolder) {
            Copy-Item -LiteralPath $sourceFolder -Destination $target -Recurse -Force
        }
    }
    Write-Output "Installed $skillName -> $target"
}
```

- [ ] **Step 2: Write README**

Document:

- what each skill owns and what it intentionally does not own;
- explicit calls `$website-build-workflow`, `$website-visual-polish`, `$website-release-qa`;
- implicit example phrases in Russian;
- validation commands;
- test installation with `-Destination`;
- personal installation command;
- official discovery location `$HOME/.agents/skills` and restart fallback if the app has not refreshed.

- [ ] **Step 3: Validate the complete source bundle**

```powershell
node tools/codex-skills/scripts/validate-skills.mjs
```

Expected: `Validated 3 skill(s).`.

- [ ] **Step 4: Test installation in a disposable workspace directory**

```powershell
$testDestination = Join-Path $env:TEMP 'codex-website-skills-install-test'
New-Item -ItemType Directory -Force -Path $testDestination | Out-Null
powershell -ExecutionPolicy Bypass -File tools\codex-skills\install-skills.ps1 -Destination $testDestination
python C:\Users\bahti\.codex\skills\skill-creator\scripts\quick_validate.py (Join-Path $testDestination 'website-build-workflow')
python C:\Users\bahti\.codex\skills\skill-creator\scripts\quick_validate.py (Join-Path $testDestination 'website-visual-polish')
python C:\Users\bahti\.codex\skills\skill-creator\scripts\quick_validate.py (Join-Path $testDestination 'website-release-qa')
```

Expected: three `Installed ...` lines and three `Skill is valid!` lines. Inspect the resolved absolute test destination before removing it; cleanup may only target that exact temporary directory.

- [ ] **Step 5: Commit installation tooling**

```powershell
git add tools/codex-skills/install-skills.ps1 tools/codex-skills/README.md
git commit -m "docs: add website skill installation workflow"
```

- [ ] **Step 6: Install to the personal skill directory**

Run with approval because the destination is outside the workspace:

```powershell
powershell -ExecutionPolicy Bypass -File tools\codex-skills\install-skills.ps1
```

Expected destinations:

```text
C:\Users\bahti\.agents\skills\website-build-workflow
C:\Users\bahti\.agents\skills\website-visual-polish
C:\Users\bahti\.agents\skills\website-release-qa
```

---

### Task 6: Inline eval pass and final verification

**Files:**
- Create: `tools/codex-skills/eval-results.md`
- Modify only if an eval exposes a defect: the affected skill files under `tools/codex-skills/`.

**Interfaces:**
- Consumes: every prompt and expectation in the three `evals/evals.json` files.
- Produces: a human-readable pass/fail report with evidence and corrected skill drafts.

- [ ] **Step 1: Run each eval inline without subagents**

For every eval, read only the selected skill plus the reference files it routes to. Produce a short response or action outline exactly as that skill would, then grade every expectation with `passed`, `failed`, and concrete evidence. Do not run baselines because this execution mode does not authorize subagent dispatch.

- [ ] **Step 2: Record results**

Create `eval-results.md` with this exact structure for all nine or more cases:

```markdown
# Website skills eval results

## [skill name] / Eval [id]

- Prompt: ...
- Result summary: ...
- Passed expectations: N/N
- Evidence:
  - [expectation]: [specific evidence]
- Corrections applied: none | [file and correction]
```

Any failed expectation requires an instruction correction and a complete rerun of that skill’s evals.

- [ ] **Step 3: Run structural validation and current-project release smoke checks**

```powershell
node tools/codex-skills/scripts/validate-skills.mjs
npm test
npm run test:ui
git diff --check
```

Expected: all three skill validations pass, Node tests pass, Playwright passes, and `git diff --check` prints nothing.

- [ ] **Step 4: Verify installed copies match canonical sources**

Use `Get-FileHash` recursively for every `SKILL.md`, reference, eval and `openai.yaml` in each canonical/installed pair. Expected: no missing files and identical SHA-256 hashes.

- [ ] **Step 5: Commit eval evidence and any corrections**

```powershell
git add tools/codex-skills
git commit -m "test: verify universal website skills"
```

- [ ] **Step 6: Final handoff**

Report:

- three installed skill paths;
- the canonical source directory;
- validation and website test results;
- examples of explicit invocation;
- whether Codex needs a restart to refresh the skill list;
- any external client information still unrelated to the skill installation.
