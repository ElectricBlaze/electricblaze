# Security

## Reporting a vulnerability

Write to **contact@electricblaze.com**. Do not open a public issue for a
vulnerability. We answer within five working days and publish a fix in a new
version; the CHANGELOG names the report.

In scope: the `electricblaze` npm package, this repository, the files the CLI
writes into a project and the skill it installs.

## What the CLI does and does not do

- Writes files only inside the project directory (or the `--dir` you pass).
  `add` and `skill` list every file they touch and never overwrite a file that
  was edited unless `--force` is given.
- Runs no install scripts and has no dependencies.
- Sends nothing anywhere. The only network call in the generated code is the
  loader's request to the ElectricBlaze API, and only when
  `ELECTRICBLAZE_API_KEY` is set (the API ships in 0.2).
- Appends a marked block to `AGENTS.md` and `CLAUDE.md` when those files exist;
  the block is plain documentation for coding agents and is listed in the
  output.

## Verifying a release

Every version is published from GitHub Actions with npm provenance: no npm
token exists outside the workflow. Check it with

```
npm audit signatures
```

after installing, or open the "Provenance" section of the version on npmjs.com.
Pin the version when you script it: `npx electricblaze@0.1.2 ...`.
