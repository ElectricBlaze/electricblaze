#!/usr/bin/env node
import { main } from "../src/cli.js";

// exitCode instead of process.exit(): stdout is flushed even when it is a pipe.
main(process.argv.slice(2)).then(
  (code) => { process.exitCode = code; },
  (e) => {
    process.stderr.write(`✗ ${e?.message ?? e}\n`);
    process.exitCode = 1;
  },
);
