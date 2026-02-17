#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { ComponentRegistry } from "./services/registry";

class SvelteUiComponentsServer {
  private server: McpServer;
  private registry: ComponentRegistry;

  constructor() {
    this.server = new McpServer({
      name: "svelte-ui-components",
      version: "1.0.0",
    });

    this.registry = new ComponentRegistry();
    this.registry.init();

    this.registerTools();
  }

  private registerTools(): void {
    this.registerListComponents();
    this.registerGetComponentDocs();
  }

  private registerListComponents(): void {
    this.server.registerTool(
      "list_components",
      {
        title: "List Components",
        description: `Returns the list of all available components with brief descriptions.

Use this to discover which components exist, then call
get_component_docs to get the full documentation for any component.`,
      },
      async () => {
        try {
          const components = this.registry.getComponentList();

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(components, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error listing components: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  private registerGetComponentDocs(): void {
    this.server.registerTool(
      "get_component_docs",
      {
        title: "Get Component Documentation",
        description: `Returns the full markdown documentation for a component.

Covers:
- Usage example (import + template)
- Props table (name, type, required, default)
- Snippets (Svelte 5 Snippet props for passing content blocks)
- Events (event handler props with callback signatures)
- CSS Variables (custom properties to override for theming)`,
        inputSchema: {
          componentName: z
            .string()
            .describe(
              'Component name from the list, e.g. "Button", "Input", "Modal"'
            ),
        },
      },
      async ({ componentName }) => {
        try {
          const docs = this.registry.getComponentDocs(componentName);
          if (!docs) {
            const available = this.registry
              .getComponentNames()
              .join(", ");
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Component "${componentName}" not found. Available: ${available}`,
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text" as const,
                text: docs,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("svelte-ui-components MCP server running on stdio");
  }
}

const server = new SvelteUiComponentsServer();
server.run().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
