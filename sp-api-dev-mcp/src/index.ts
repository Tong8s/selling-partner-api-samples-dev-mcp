#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  OrdersApiTool,
  SPAPIConfig,
} from "./tools/api-tools/orders-api-tools.js";
import { SPAPIMigrationAssistantTool } from "./tools/migration-assistant-tools/migration-tools.js";
import {
  searchOrdersSchema,
  getOrderSchema,
  cancelOrderSchema,
  updateShipmentStatusSchema,
  updateVerificationStatusSchema,
  confirmShipmentSchema,
  getOrderRegulatedInfoSchema,
} from "./zod-schemas/orders-schemas.js";
import { migrationAssistantSchema } from "./zod-schemas/migration-schemas.js";
import { config } from "dotenv";

config();

interface ConfigFile {
  SP_API_CLIENT_ID?: string;
  SP_API_CLIENT_SECRET?: string;
  SP_API_REFRESH_TOKEN?: string;
  SP_API_BASE_URL?: string;
}

class SPAPIDevMCPServer {
  private server: McpServer;
  private ordersApiTool: OrdersApiTool;
  private migrationAssistantTool: SPAPIMigrationAssistantTool;

  constructor() {
    this.server = new McpServer({
      name: "selling-partner-api-dev-mcp",
      version: "1.1.0",
    });

    const config = this.getAuthFromEnv();
    this.ordersApiTool = new OrdersApiTool(config);
    this.migrationAssistantTool = new SPAPIMigrationAssistantTool();
    this.setupTools();
  }

  private setupTools(): void {
    // Register Orders API V1 Tools
    this.server.registerTool(
      "search_orders",
      {
        description:
          "Search orders with various filters and include specific data sets. Use this to get orders by date, status, marketplace, etc.",
        inputSchema: searchOrdersSchema,
      },
      async (args: any) => {
        return await this.ordersApiTool.searchOrders(args);
      },
    );

    this.server.registerTool(
      "get_order",
      {
        description:
          "Get detailed information for a specific order by order ID",
        inputSchema: getOrderSchema,
      },
      async (args: any) => {
        return await this.ordersApiTool.getOrder(args);
      },
    );

    this.server.registerTool(
      "cancel_order",
      {
        description: "Cancel a specific order with a reason code",
        inputSchema: cancelOrderSchema,
      },
      async (args: any) => {
        return await this.ordersApiTool.cancelOrder(args);
      },
    );

    // Register Orders API V0 Tools
    this.server.registerTool(
      "update_shipment_status",
      {
        description:
          "Update shipment status for an order (V0 API - for orders that require shipment status updates)",
        inputSchema: updateShipmentStatusSchema,
      },
      async (args: any) => {
        return await this.ordersApiTool.updateShipmentStatus(args);
      },
    );

    this.server.registerTool(
      "update_verification_status",
      {
        description:
          "Update verification status for regulated orders (V0 API - for compliance-related orders)",
        inputSchema: updateVerificationStatusSchema,
      },
      async (args: any) => {
        return await this.ordersApiTool.updateVerificationStatus(args);
      },
    );

    this.server.registerTool(
      "confirm_shipment",
      {
        description:
          "Confirm shipment for an order (V0 API - for orders that require shipment confirmation)",
        inputSchema: confirmShipmentSchema,
      },
      async (args: any) => {
        return await this.ordersApiTool.confirmShipment(args);
      },
    );

    this.server.registerTool(
      "get_order_regulated_info",
      {
        description:
          "Get regulated information for an order (V0 API - for compliance-related orders)",
        inputSchema: getOrderRegulatedInfoSchema,
      },
      async (args: any) => {
        return await this.ordersApiTool.getOrderRegulatedInfo(args);
      },
    );

    // Register Migration Assistant Tool
    this.server.registerTool(
      "migration_assistant",
      {
        description:
          "Assists with API version migrations. Can provide general migration guidance or analyze existing code and generate refactored implementations. When source_code is provided: returns detailed analysis with deprecated endpoints, breaking changes, refactored code, and migration checklist. When source_code is omitted: returns comprehensive migration guide with API mappings, attribute changes, code examples, and best practices. Supported Migrations: Orders API v0 → v2026-01-01",
        inputSchema: migrationAssistantSchema,
      },
      async (args: any) => {
        return await this.migrationAssistantTool.migrationAssistant(args);
      },
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  private getAuthFromEnv(): SPAPIConfig {
    return {
      clientId: process.env.SP_API_CLIENT_ID,
      clientSecret: process.env.SP_API_CLIENT_SECRET,
      refreshToken: process.env.SP_API_REFRESH_TOKEN,
      baseUrl: process.env.SP_API_BASE_URL,
    };
  }
}

try {
  const server = new SPAPIDevMCPServer();
  await server.run();
} catch (error) {
  process.exit(1);
}
