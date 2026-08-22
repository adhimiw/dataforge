---
name: dataforge-release-workflow
description: "Create or maintain a distinct, data-governed DataForge-style terminal-agent fork with Zen/Big Pickle defaults, durable workspace diagnostics, focused CI, and a GitHub Pages companion site. Use when adapting an OpenCode-style TUI into a branded task agent, publishing its documentation site, or preparing a safe GitHub release."
---

# DataForge Release Workflow

Use this workflow to create or extend a distinct terminal agent for reproducible data work. Preserve upstream compatibility where it is technical, but make the public identity, operating procedure, safety policy, and documentation unmistakably specific to the new product.

## 1. Establish the fork boundary

1. Inspect the upstream license, package names, executable entry point, TUI branding, configuration merge order, provider registry, agent registry, and test conventions.
2. Record the compatibility identifiers that must remain internal. Do not rename a provider ID, model ID, or environment variable unless the upstream integration actually supports the replacement.
3. Keep an explicit brand module containing the visible product name, provider label, model policy, workflow commands, and runtime gate. Apply fork defaults only from the fork executable so library consumers and user configuration remain neutral.
4. Replace high-visibility surfaces: binary help, terminal mark, home prompts, credential dialog, model errors, recovery text, README, and any public website. Do not present a token replacement as a new product.

## 2. Configure the data-agent runtime

1. Default to the approved model only when the project has not made an explicit model choice. Preserve explicit user configuration.
2. Read credentials from an environment variable. Never place a credential in source, examples, fixtures, state, logs, screenshots, artifacts, Git history, or copied commands.
3. Add a primary agent prompt that requires inspection before transformation, reproducible scripts or notebooks, evidence-based debugging, minimal approval-aware changes, and verification before success claims.
4. Add deterministic `workspace init` and `workspace doctor` commands. Doctor must report only credential presence, never a credential value or remote validation response.
5. Keep local artifact state ignored by Git. Store paths, assumptions, checks, and aggregate metrics only; never raw restricted records or secrets.

## 3. Add data governance before automation

Write project instructions that classify data, minimize exposure, keep restricted material in approved boundaries, require approval for destructive or external operations, prefer synthetic fixtures, and require an output review before release. State that local project policy, contract, and law override the generic rules.

## 4. Build the companion site

1. Translate any reference brief into a distinct brand direction; do not reuse names, wordmarks, or marketing copy.
2. Make the site explain the story, architecture, model/provider integration, extension points, workspace initialization, diagnostics, and verified limitations.
3. For a project Pages deployment, bundle all required static assets inside the website's public directory and set the build base path to `/<repository>/` in the CI environment. Do not depend on development-only storage URLs, local proxies, or private secrets.
4. Build and typecheck the site before every release. Confirm command-copy controls, navigation, responsive layout, and any asset URLs work under the repository subpath.

## 5. Add focused automation

1. Add a short CI workflow triggered on pushes and pull requests that affect the forked runtime. Reuse the repository's package setup action when it exists.
2. Run only the regression tests that demonstrate the fork’s policy, then typecheck the TUI or affected package. Avoid a resource-heavy full workspace check if it is known to exceed the runner or sandbox envelope; document the limitation.
3. Add a separate Pages workflow triggered by website changes. It must build the site, upload the compiled artifact, and use the official Pages deployment actions with `pages: write` and `id-token: write` permissions.

## 6. Publish safely

1. Ask for confirmation before creating repositories, changing visibility, pushing commits, enabling external deployments, or granting OAuth scopes.
2. Create a new repository as private unless the user explicitly requests public visibility.
3. Before enabling GitHub Pages, state that Pages is externally accessible if the account plan permits private-repository Pages. Verify plan availability and the current Pages configuration; do not assume private source means private site.
4. Push a clean commit, verify the target branch and repository URL, inspect the workflow run, and report the deployed URL or a precise blocker.

## Completion checklist

- Fork branding, runtime defaults, and explicit user-model preservation are tested.
- Credentials and restricted data are absent from Git-tracked content.
- Governance rules and workspace runbook are present.
- Focused CI is green or a limitation is documented.
- Companion-site build is portable under the GitHub Pages subpath.
- Repository, commit, workflow run, and deployment status are verified after the user-approved push.
