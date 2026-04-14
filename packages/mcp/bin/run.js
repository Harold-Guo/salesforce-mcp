#!/usr/bin/env node

// Handle setup/unsetup before oclif takes over
const subcommand = process.argv[2];

if (subcommand === 'setup') {
  const { runSetup } = await import('../lib/setup.js');
  await runSetup();
  process.exit(0);
}

if (subcommand === 'unsetup') {
  const { runUnsetup } = await import('../lib/setup.js');
  await runUnsetup();
  process.exit(0);
}

// Default: start the MCP server via oclif
if (process.argv.includes('--debug')) {
  process.env.DEBUG = 'sf*';
  process.env.SF_LOG_COLORIZE = 'false';
  process.env.SF_LOG_STDERR = 'true';
  process.env.SF_LOG_LEVEL = 'trace';
}

import { execute } from '@oclif/core';

await execute({ dir: import.meta.url });
