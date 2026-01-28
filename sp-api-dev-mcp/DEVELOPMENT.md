# SP-API Dev MCP Server - Development Guide

## Repository

```
https://github.com/amzn/selling-partner-api-samples
└── sp-api-dev-mcp/
```

## Project Structure

```
sp-api-dev-mcp/
├── src/
│   ├── index.ts                    # MCP server entry point & tool registration
│   ├── auth/
│   │   ├── credential-store.ts     # In-memory credential management
│   │   └── sp-api-auth.ts          # SP-API authentication (LWA token handling)
│   ├── tools/
│   │   ├── api-tools/              # SP-API endpoint tools
│   │   │   └── orders-api-tools.ts
│   │   ├── auth-tools/             # Credential management tools
│   │   │   └── credential-tools.ts
│   │   └── migration-assistant-tools/
│   │       └── migration-tools.ts
│   ├── zod-schemas/                # Input validation schemas
│   │   ├── credential-schemas.ts
│   │   ├── migration-schemas.ts
│   │   └── orders-schemas.ts
│   └── utils/
│       └── logger.ts
├── tests/                          # Jest test files (mirrors src/ structure)
├── dist/                           # Compiled output
├── package.json
└── tsconfig.json
```

## Setup

```bash
cd sp-api-dev-mcp
npm install
```

## Adding a New Tool

### Step 1: Create the Zod Schema

Create or update a schema file in `src/zod-schemas/`:

```typescript
// src/zod-schemas/my-tool-schemas.ts
import { z } from "zod";

export const myToolSchema = z.object({
  action: z.enum(["action1", "action2"]).describe("Action to perform"),
  param1: z.string().describe("Description for param1"),
  param2: z.number().optional().describe("Optional numeric parameter"),
});
```

### Step 2: Create the Tool Class

Create a tool file in the appropriate `src/tools/` subdirectory:

```typescript
// src/tools/api-tools/my-api-tools.ts
import { credentialStore } from "../../auth/credential-store.js";
import { SPAPIAuth } from "../../auth/sp-api-auth.js";

export interface MyToolArgs {
  action: "action1" | "action2";
  param1: string;
  param2?: number;
}

export interface ToolResponse {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export class MyApiTool {
  async handleRequest(args: MyToolArgs): Promise<ToolResponse> {
    // Check credentials if needed
    if (!credentialStore.isConfigured()) {
      return {
        content: [{ type: "text", text: "❌ Credentials required" }],
        isError: true,
      };
    }

    switch (args.action) {
      case "action1":
        return this.doAction1(args);
      case "action2":
        return this.doAction2(args);
      default:
        return {
          content: [{ type: "text", text: `Unknown action: ${args.action}` }],
          isError: true,
        };
    }
  }

  private async doAction1(args: MyToolArgs): Promise<ToolResponse> {
    // Implementation
    return {
      content: [{ type: "text", text: "Action 1 completed" }],
    };
  }

  private async doAction2(args: MyToolArgs): Promise<ToolResponse> {
    // Implementation
    return {
      content: [{ type: "text", text: "Action 2 completed" }],
    };
  }
}
```

### Step 3: Register the Tool

Update `src/index.ts`:

```typescript
// Add imports
import { MyApiTool } from "./tools/api-tools/my-api-tools.js";
import { myToolSchema } from "./zod-schemas/my-tool-schemas.js";

class SPAPIDevMCPServer {
  private myApiTool: MyApiTool;

  constructor() {
    // ... existing code ...
    this.myApiTool = new MyApiTool();
    this.setupTools();
  }

  private setupTools(): void {
    // ... existing tools ...

    // Register your new tool
    this.server.registerTool(
      "my_tool",  // Tool name (use snake_case)
      {
        description: "Brief description of what the tool does",
        inputSchema: myToolSchema,
      },
      async (args: any) => {
        return await this.myApiTool.handleRequest(args);
      },
    );
  }
}
```

### Step 4: Add Tests

Create test files mirroring the source structure:

```typescript
// tests/zod-schemas/my-tool-schemas.test.ts
import { myToolSchema } from "../../src/zod-schemas/my-tool-schemas";

describe("myToolSchema", () => {
  it("should accept valid input", () => {
    const result = myToolSchema.safeParse({
      action: "action1",
      param1: "test",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid action", () => {
    const result = myToolSchema.safeParse({
      action: "invalid",
      param1: "test",
    });
    expect(result.success).toBe(false);
  });
});
```

```typescript
// tests/tools/my-api-tools.test.ts
import { MyApiTool } from "../../src/tools/api-tools/my-api-tools";
import { credentialStore } from "../../src/auth/credential-store";

describe("MyApiTool", () => {
  let tool: MyApiTool;

  beforeEach(() => {
    tool = new MyApiTool();
    credentialStore.clearCredentials();
  });

  it("should return error without credentials", async () => {
    const result = await tool.handleRequest({
      action: "action1",
      param1: "test",
    });
    expect(result.isError).toBe(true);
  });

  it("should handle action1", async () => {
    credentialStore.setCredentials({
      clientId: "test",
      clientSecret: "test",
      refreshToken: "test",
    });

    const result = await tool.handleRequest({
      action: "action1",
      param1: "test",
    });
    expect(result.isError).toBeUndefined();
  });
});
```

## Local Development

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

### Lint & Format

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format code
npm run type-check    # TypeScript type checking
```

### Local Testing with MCP Client

1. Build the project:
   ```bash
   npm run build
   ```

2. Configure your MCP client (e.g., Kiro's `~/.kiro/settings/mcp.json`):
   ```json
   {
     "mcpServers": {
       "sp-api-dev-mcp": {
         "command": "node",
         "args": ["/absolute/path/to/sp-api-dev-mcp/dist/index.js"],
         "env": {
           "SP_API_CLIENT_ID": "your_client_id",
           "SP_API_CLIENT_SECRET": "your_client_secret",
           "SP_API_REFRESH_TOKEN": "your_refresh_token"
         }
       }
     }
   }
   ```

3. Restart/reconnect the MCP server in your client

### Quick Server Test

Test the server responds to MCP protocol:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js
```

## Release to npm (Do NOT release until we are in g2g state)

### Automated Release

1. Update `CHANGELOG.md` with your changes

2. Ensure all checks pass:
   ```bash
   npm test
   npm run lint
   npm run type-check
   npm run build
   ```

3. Commit and push to `main`

4. Go to GitHub Actions → "Release MCP Server" workflow → Run workflow

5. Enter the new version number (e.g., `0.2.0`)

### Verify Release

```bash
# Check npm
npm view @amazon-sp-api-release/dev-mcp

# Test installation
npx -y @amazon-sp-api-release/dev-mcp@0.2.0
```


## Best Practices

1. **Validation**: Always use Zod schemas for input validation
2. **Error Handling**: Return `isError: true` with helpful error messages
3. **Credentials**: Check `credentialStore.isConfigured()` before API calls
4. **Testing**: Write tests for both schemas and tool logic
5. **Documentation**: Update README.md when adding new tools
6. **Naming**: Use `snake_case` for tool names, `camelCase` for methods
