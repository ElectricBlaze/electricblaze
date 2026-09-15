#!/usr/bin/env node
import { main } from "../src/cli.js";

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => {
    process.stderr.write(`✗ ${e?.message ?? e}\n`);
    process.exit(1);
  },
);
