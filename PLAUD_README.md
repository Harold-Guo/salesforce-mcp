# @plaud-dev/mcp-salesforce

A fork of the [Salesforce DX MCP Server](https://github.com/salesforcecli/mcp) with built-in OAuth login — no Salesforce CLI pre-installation required.

## What's Different

This fork adds an `org_login_web` tool that lets you authenticate to Salesforce directly from your AI assistant (Claude Desktop, Claude Code, etc.) via browser OAuth. The official package requires running `sf org login web` in a terminal first.

## Setup

### 1. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "Salesforce DX": {
      "command": "npx",
      "args": [
        "-y", "@plaud-dev/mcp-salesforce",
        "--toolsets", "all",
        "--orgs", "ALLOW_ALL_ORGS",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

### 2. Add to Claude Code

Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "Salesforce DX": {
      "command": "npx",
      "args": [
        "-y", "@plaud-dev/mcp-salesforce",
        "--toolsets", "all",
        "--orgs", "ALLOW_ALL_ORGS",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

### 3. Restart your AI client

After editing the config, restart Claude Desktop or reload Claude Code.

## Login

Once connected, tell your AI assistant:

> "Login to Salesforce" or "Connect to my Salesforce org"

The `org_login_web` tool will open a browser window for OAuth authentication. After you complete login, the org is available for all other tools.

For sandboxes:

> "Login to my Salesforce sandbox"

Claude will use `https://test.salesforce.com` automatically.

## Available Tools

All tools from the official Salesforce DX MCP Server, plus:

| Tool | Description |
|------|-------------|
| `org_login_web` | Authenticate to Salesforce via browser OAuth (new) |
| `list_all_orgs` | List connected orgs |
| `run_soql_query` | Query Salesforce data |
| `deploy_metadata` | Deploy metadata to org |
| `run_apex_test` | Run Apex tests |
| ...and more | See [official docs](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_mcp.htm) |

## Contributing

The `org_login_web` tool is also submitted as a PR to the [official Salesforce MCP repo](https://github.com/salesforcecli/mcp). Once merged, this fork will no longer be necessary.
