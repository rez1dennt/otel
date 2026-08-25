# Safe Git and publication handoff

Read this reference before staging, committing, integrating, pushing, deploying or publishing.

## Establish state

Record:

- `git status --short`;
- current branch and whether HEAD is detached;
- remote names/URLs and upstream;
- recent log and base/target relationship;
- task-owned changes versus pre-existing user changes;
- fresh test evidence for the exact working tree.

Do not use destructive reset, broad checkout, force push or history rewrite unless the user explicitly requests that exact operation and the target has been verified.

## Staging scope

Default: stage only files required by the current task. If the user explicitly says to push “all” changes, show the complete status and include all intended tracked/untracked files after checking for secrets, generated runtime artifacts and accidental large files. The word “all” authorizes inclusion; it does not authorize deleting or rewriting the user’s work.

Run `git diff --check` before staging and inspect the staged diff summary before committing.

## Branch and target

- If the user names a target branch, respect it after verifying the current branch can be integrated safely.
- If currently on a feature branch and the request is to update `main`, use the repository’s established merge/PR workflow or `finishing-a-development-branch`; do not silently push the feature branch under the main name.
- If no target is named, use the existing upstream/current branch rather than inventing one.
- Never force a non-fast-forward update to make the command pass.

## Commit and push

1. Verify fresh tests and staged scope.
2. Use a cohesive commit message describing the actual change.
3. Confirm the created commit hash.
4. Push with a normal non-force command to the intended remote/branch.
5. Verify the remote ref with `git ls-remote` or the hosting provider’s authoritative result.
6. Report local commit, remote branch and whether their hashes match.

Do not say “pushed” when authentication, network, hooks, non-fast-forward or repository policy rejected the command.

## Publication/deployment

Publishing is separate from pushing unless the repository’s documented pipeline proves otherwise. Confirm build/deployment status and the final URL before saying the site is live. State which external items remain client-controlled.

## Final report

```text
Branch: [source -> target]
Commit: [hash and subject]
Remote: [name/branch and verified hash]
Checks: [fresh commands and results]
Unpublished/unverified: [items or none]
```

