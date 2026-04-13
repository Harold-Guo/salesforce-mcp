/*
 * Copyright 2026, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';
import { WebOAuthServer, StateAggregator } from '@salesforce/core';
import open from 'open';
import { McpTool, McpToolConfig, ReleaseState, Services, Toolset } from '@salesforce/mcp-provider-api';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { textResponse } from '../shared/utils.js';
import { directoryParam } from '../shared/params.js';

/*
 * Login to a Salesforce org via browser OAuth flow.
 *
 * Opens a browser window for Salesforce OAuth. After the user completes
 * authentication in the browser, the org is stored locally and available
 * for use with other tools — no CLI pre-installation required.
 *
 * Parameters:
 * - instanceUrl: Salesforce login URL (default: https://login.salesforce.com)
 * - alias: Optional alias to assign to the org after login
 * - directory: directory to run this tool from
 */

export const orgLoginWebParamsSchema = z.object({
  instanceUrl: z
    .string()
    .optional()
    .default('https://login.salesforce.com')
    .describe(
      'Salesforce instance URL to authenticate against. ' +
      'Use https://test.salesforce.com for sandboxes, or your custom domain (e.g. https://mycompany.my.salesforce.com).'
    ),
  alias: z
    .string()
    .optional()
    .describe('Alias to assign to this org after login (e.g. "my-prod-org"). Makes it easier to reference later.'),
  directory: directoryParam,
});

type InputArgs = z.infer<typeof orgLoginWebParamsSchema>;
type InputArgsShape = typeof orgLoginWebParamsSchema.shape;
type OutputArgsShape = z.ZodRawShape;

export class OrgLoginWebMcpTool extends McpTool<InputArgsShape, OutputArgsShape> {
  // services is accepted for interface consistency but not needed for OAuth login
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(_services: Services) {
    super();
  }

  public getReleaseState(): ReleaseState {
    return ReleaseState.NON_GA;
  }

  public getToolsets(): Toolset[] {
    return [Toolset.ORGS];
  }

  public getName(): string {
    return 'org_login_web';
  }

  public getConfig(): McpToolConfig<InputArgsShape, OutputArgsShape> {
    return {
      title: 'Login to Salesforce Org',
      description: `Authenticate to a Salesforce org using OAuth web flow. Opens a browser window for login — no Salesforce CLI installation required.

WHEN TO USE THIS TOOL:
- User wants to connect to a Salesforce org for the first time
- User's Salesforce session has expired and needs to re-authenticate
- User wants to connect to a sandbox or custom domain org
- list_all_orgs returns empty or the needed org is not listed

IMPORTANT:
- This tool opens the browser and waits for the user to complete login
- Tell the user to check their browser and complete the Salesforce login
- After login completes in the browser, this tool will return the authenticated username

Example usage:
Login to my Salesforce org
Connect to Salesforce
Authenticate with Salesforce
Login to my sandbox
Connect to https://mycompany.my.salesforce.com`,
      inputSchema: orgLoginWebParamsSchema.shape,
      outputSchema: undefined,
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
      },
    };
  }

  public async exec(input: InputArgs): Promise<CallToolResult> {
    try {
      process.chdir(input.directory);

      const oauthServer = await WebOAuthServer.create({
        oauthConfig: {
          loginUrl: input.instanceUrl,
          scope: 'api web refresh_token',
        },
      });

      await oauthServer.start();

      const authorizationUrl = oauthServer.getAuthorizationUrl();
      await open(authorizationUrl);

      // Wait for user to complete OAuth in browser
      const authInfo = await oauthServer.authorizeAndSave();
      const username = authInfo.getUsername();

      // Optionally assign alias
      if (input.alias) {
        const stateAggregator = await StateAggregator.getInstance();
        await stateAggregator.aliases.setAndSave(input.alias, username);
      }

      const lines = [
        `Successfully logged in to Salesforce.`,
        ``,
        `Username: ${username}`,
        `Instance URL: ${input.instanceUrl}`,
      ];
      if (input.alias) lines.push(`Alias: ${input.alias}`);
      lines.push(``, `This org is now available. Use #get_username or #list_all_orgs to confirm.`);

      return textResponse(lines.join('\n'));
    } catch (error) {
      return textResponse(
        `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        `If the browser did not open, try navigating manually to your Salesforce org login page.`,
        true
      );
    }
  }
}
