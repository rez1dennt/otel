---
name: website-release-qa
description: Use when an HTML/CSS/JavaScript website is about to be declared ready, shown to a client, committed, published, deployed, or pushed to Git, including requests such as “готово?”, “можно показывать?”, “проверь весь сайт”, “запушь всё”, “залей в main”, “релиз” or “публикуй”. Also use after a final responsive or interaction failure involving fixed headers, burger navigation, modals, forms, FAQ or Cookie controls. Do not use as the primary design/build workflow or for an early isolated visual correction that is not being handed off.
---

# Website Release QA

## Overview

Readiness is a claim that requires fresh evidence from the exact files being handed off. User urgency authorizes the requested release action; it does not convert yesterday’s test result or one screenshot into proof.

## Evidence gate

**REQUIRED SUB-SKILL:** Use `verification-before-completion` before every readiness claim. Use `systematic-debugging` and `test-driven-development` when any check fails. Use `finishing-a-development-branch` when branch integration or cleanup is required.

1. Inspect project instructions, working-tree status, active branch, remote/upstream, package scripts and public-route sources.
2. Preserve unrelated user work. If the user explicitly says “all”, show the complete included scope before staging it.
3. Run existing focused and full automated tests plus `git diff --check` with the current files.
4. Read [browser-release-checklist.md](references/browser-release-checklist.md). Discover every public route and test the applicable route/viewport/interaction matrix.
5. If browser QA is required and Playwright is absent, add a project-local setup and browser runtime. Do not silently downgrade to visual guessing.
6. Treat every failure as blocking. Reproduce it, add or retain a failing regression, fix the shared cause, rerun the focused check and then the full applicable suite.
7. Separate code readiness from missing external launch inputs such as domain, endpoint, analytics, payment, legal confirmation or real client content.
8. Read [git-handoff.md](references/git-handoff.md) before commit, integration, push, deployment or publication.
9. Perform only the externally mutating action the user authorized. Confirm its actual result before reporting success.

## Required release matrix

Unless the project defines stricter targets, include:

- all intended public routes;
- desktop around `1280px`;
- an intermediate width around `768px` or the actual breakpoint edge;
- mobile `360px`;
- narrow mobile `320px`;
- menu, modal, forms, FAQ and Cookie states that exist in the project;
- fixed-header geometry, anchor offsets, horizontal overflow, console and failed-resource checks;
- links, images, metadata, structured data, sitemap, robots and legal links when applicable.

## Completion report

Return this compact evidence shape:

```text
Changes: [scope handed off]
Automated: [commands and pass counts]
Browser: [routes/viewports/interactions]
Git/publish: [branch, commit, remote result or not requested]
External inputs: [remaining client-controlled launch items]
```

If any field is unverified, label it unverified and do not use “ready”, “fixed”, “pushed” or “published” for that field.

## Pressure resistance

| Pressure | Required response |
|---|---|
| “It is only CSS” | Run the affected viewport and shared-component regression matrix |
| “It passed yesterday” | Run fresh checks against the current working tree |
| “Push now” | Move quickly through the gate; do not delete the gate |
| “Most pages look fine” | Test all shared variants and public-route overflow |
| Browser tooling is missing | Configure project-local Playwright or report a blocker |
| One focused fix passes | Rerun the full applicable suite before completion |

## Red flags — stop the handoff

- Claiming success from memory, source inspection or an earlier run.
- Skipping `320px`, close animations, scroll restoration or console errors.
- Hiding overflow globally instead of identifying the element.
- Staging unrelated files without the user’s explicit “all” instruction.
- Ignoring a failing test as pre-existing without evidence and user direction.
- Using force push, destructive reset or history rewriting without explicit authorization.
- Reporting push success without a successful command and remote commit verification.

