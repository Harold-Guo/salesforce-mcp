/*
 * Copyright 2026, Plaud, Inc.
 *
 * Setup/unsetup commands for registering the Salesforce MCP server
 * in Claude Desktop's configuration file.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

const SERVER_NAME = 'Salesforce DX';

function getConfigPath(): string | null {
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? '', 'Claude', 'claude_desktop_config.json');
  }
  return null;
}

function getMcpEntry(): Record<string, unknown> {
  return {
    command: 'npx',
    args: ['-y', '@plaud-dev/mcp-salesforce', '--toolsets', 'all', '--orgs', 'ALLOW_ALL_ORGS'],
  };
}

export async function runSetup(): Promise<void> {
  const configPath = getConfigPath();

  if (!configPath) {
    console.error('Claude Desktop is only supported on macOS and Windows.');
    process.exit(1);
  }

  let config: Record<string, unknown> = {};
  try {
    const raw = await readFile(configPath, 'utf-8');
    config = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Config file doesn't exist yet, will create it
  }

  const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;

  if (mcpServers[SERVER_NAME]) {
    console.log('Salesforce MCP is already configured in Claude Desktop.');
    console.log('Restart Claude Desktop if you haven\'t already.');
    return;
  }

  config.mcpServers = { ...mcpServers, [SERVER_NAME]: getMcpEntry() };

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

  console.log('Salesforce MCP has been added to Claude Desktop.');
  console.log('Please restart Claude Desktop to complete the setup.');
  process.exit(0);
}

export async function runUnsetup(): Promise<void> {
  const configPath = getConfigPath();

  if (!configPath) {
    console.error('Claude Desktop is only supported on macOS and Windows.');
    process.exit(1);
  }

  let config: Record<string, unknown> = {};
  try {
    const raw = await readFile(configPath, 'utf-8');
    config = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.log('Claude Desktop config file not found. Nothing to remove.');
    return;
  }

  const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;

  if (!mcpServers[SERVER_NAME]) {
    console.log('Salesforce MCP is not configured in Claude Desktop. Nothing to remove.');
    return;
  }

  const { [SERVER_NAME]: _, ...rest } = mcpServers;
  config.mcpServers = rest;

  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

  console.log('Salesforce MCP has been removed from Claude Desktop.');
  console.log('Please restart Claude Desktop to complete the unsetup.');
  process.exit(0);
}
