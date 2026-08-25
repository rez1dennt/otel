# Personal website skills

Canonical, versioned sources for three Codex skills used across HTML/CSS/JavaScript website projects.

## Skills

| Skill | Use it for | Keep out of scope |
|---|---|---|
| `$website-build-workflow` | New sites, coordinated page families, client-material intake, content templates, optional WordPress handoff | One isolated visual defect; final Git release only |
| `$website-visual-polish` | Screenshot feedback, responsive defects, fixed header/burger stability, cards, spacing, media and mobile audit | Primary new-site architecture; release-only push |
| `$website-release-qa` | “Ready?”, client presentation, all-site verification, commit, publish or push | Early design exploration or an unfinished isolated component |

Codex can invoke them implicitly from the `description`, or explicitly with the `$skill-name` syntax.

Examples:

```text
Use $website-build-workflow to build this multi-page static site from the supplied brief and images.
Use $website-visual-polish to fix the jumping fixed header and abrupt burger menu at 360px and 320px.
Use $website-release-qa to verify everything with fresh evidence and push the approved changes to main.
```

## Validate canonical sources

```powershell
node tools\codex-skills\scripts\validate-skills.mjs
```

Optional validation with the installed skill-creator runtime:

```powershell
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' `
  'C:\Users\bahti\.codex\skills\skill-creator\scripts\quick_validate.py' `
  'tools\codex-skills\website-build-workflow'
```

Repeat the final argument for the other two skill directories.

## Test installation

```powershell
$testDestination = Join-Path $env:TEMP ('codex-website-skills-' + [guid]::NewGuid())
powershell -ExecutionPolicy Bypass -File tools\codex-skills\install-skills.ps1 -Destination $testDestination
```

Validate each installed test directory with `quick_validate.py` before using it.

## Personal installation

```powershell
powershell -ExecutionPolicy Bypass -File tools\codex-skills\install-skills.ps1
```

The default destination is the current user’s official personal skill directory:

```text
$HOME/.agents/skills
```

Codex normally detects skill changes automatically. Restart the app if updated skills do not appear in the selector.

## Maintenance

Edit the canonical copy under `tools/codex-skills/`, run both validators and its eval scenarios, commit the correction, then rerun the installer. Do not edit only the installed copy because it will diverge from the versioned source.
