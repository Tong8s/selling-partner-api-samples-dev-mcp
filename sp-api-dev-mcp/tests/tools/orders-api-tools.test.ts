import { OrdersApiTool } from "../../src/tools/api-tools/orders-api-tools";
import { SPAPIAuth } from "../../src/auth/sp-api-auth";

jest.mock("../../src/auth/sp-api-auth");

describe("OrdersApiTool", () => {
  let ordersApiTool: OrdersApiTool;
  let mockAuth: jest.Mocked<SPAPIAuth>;

  const mockConfig = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    refreshToken: "test-refresh-token",
    baseUrl: "https://sellingpartnerapi-na.amazon.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = new SPAPIAuth(mockConfig) as jest.Mocked<SPAPIAuth>;
    ordersApiTool = new OrdersApiTool(mockConfig);
    (ordersApiTool as any).auth = mockAuth;
  });

  describe("constructor", () => {
    it("should initialize with credentials", () => {
      const tool = new OrdersApiTool(mockConfig);
      expect(tool).toBeInstanceOf(OrdersApiTool);
    });

    it("should initialize without credentials", () => {
      const tool = new OrdersApiTool();
      expect(tool).toBeInstanceOf(OrdersApiTool);
    });

    it("should use default base URL if not provided", () => {
      const tool = new OrdersApiTool({
        clientId: "test",
        clientSecret: "test",
        refreshToken: "test",
      });
      expect(tool).toBeInstanceOf(OrdersApiTool);
    });
  });

  describe("searchOrders", () => {
    it("should return error if no credentials provided", async () => {
      const toolWithoutCreds = new OrdersApiTool();
      const result = await toolWithoutCreds.searchOrders({
        createdAfter: "2025-01-01T00:00:00Z",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Credentials Required");
    });

    it("should return error if neither createdAfter nor lastUpdatedAfter provided", async () => {
      const result = await ordersApiTool.searchOrders({
        marketplaceIds: ["ATVPDKIKX0DER"],
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(
        "Either createdAfter or lastUpdatedAfter must be provided",
      );
    });

    it("should successfully search orders", async () => {
      const mockResponse = {
        data: {
          orders: [
            {
              orderId: "123-4567890-1234567",
              createdTime: "2025-01-20T10:00:00Z",
              fulfillment: { fulfillmentStatus: "UNSHIPPED" },
            },
          ],
        },
      };

      mockAuth.makeAuthenticatedRequest.mockResolvedValueOnce(
        mockResponse as any,
      );

      const result = await ordersApiTool.searchOrders({
        createdAfter: "2025-01-01T00:00:00Z",
        marketplaceIds: ["ATVPDKIKX0DER"],
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Found 1 orders");
      expect(mockAuth.makeAuthenticatedRequest).toHaveBeenCalledWith(
        "GET",
        "https://sellingpartnerapi-na.amazon.com/orders/2026-01-01/orders",
        expect.objectContaining({
          createdAfter: "2025-01-01T00:00:00Z",
          marketplaceIds: "ATVPDKIKX0DER",
        }),
      );
    });

    it("should handle API errors", async () => {
      mockAuth.makeAuthenticatedRequest.mockRejectedValueOnce(
        new Error("API Error"),
      );

      const result = await ordersApiTool.searchOrders({
        createdAfter: "2025-01-01T00:00:00Z",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error: API Error");
    });
  });

  describe("getOrder", () => {
    it("should return error if no credentials provided", async () => {
      const toolWithoutCreds = new OrdersApiTool();
      const result = await toolWithoutCreds.getOrder({
        orderId: "123-4567890-1234567",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Credentials Required");
    });

    it("should successfully get order details", async () => {
      const mockResponse = {
        data: {
          order: {
            orderId: "123-4567890-1234567",
            createdTime: "2025-01-20T10:00:00Z",
            lastUpdatedTime: "2025-01-20T11:00:00Z",
            fulfillment: { fulfillmentStatus: "UNSHIPPED" },
          },
        },
      };

      mockAuth.makeAuthenticatedRequest.mockResolvedValueOnce(
        mockResponse as any,
      );

      const result = await ordersApiTool.getOrder({
        orderId: "123-4567890-1234567",
        includedData: ["BUYER", "RECIPIENT"],
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Order Details");
      expect(result.content[0].text).toContain("123-4567890-1234567");
      expect(mockAuth.makeAuthenticatedRequest).toHaveBeenCalledWith(
        "GET",
        "https://sellingpartnerapi-na.amazon.com/orders/2026-01-01/orders/123-4567890-1234567",
        expect.objectContaining({
          includedData: "BUYER,RECIPIENT",
        }),
      );
    });
  });

  describe("cancelOrder", () => {
    it("should return error if no credentials provided", async () => {
      const toolWithoutCreds = new OrdersApiTool();
      const result = await toolWithoutCreds.cancelOrder({
        orderId: "123-4567890-1234567",
        cancelReasonCode: "NO_INVENTORY",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Credentials Required");
    });

    it("should successfully cancel order", async () => {
      mockAuth.makeAuthenticatedRequest.mockResolvedValueOnce({
        data: {},
      } as any);

      const result = await ordersApiTool.cancelOrder({
        orderId: "123-4567890-1234567",
        cancelReasonCode: "NO_INVENTORY",
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("cancellation request accepted");
      expect(mockAuth.makeAuthenticatedRequest).toHaveBeenCalledWith(
        "PUT",
        "https://sellingpartnerapi-na.amazon.com/orders/2026-01-01/orders/123-4567890-1234567/cancellation",
        {},
        { cancelReasonCode: "NO_INVENTORY" },
      );
    });
  });

  describe("updateShipmentStatus", () => {
    it("should successfully update shipment status", async () => {
      mockAuth.makeAuthenticatedRequest.mockResolvedValueOnce({
        data: { success: true },
      } as any);

      const result = await ordersApiTool.updateShipmentStatus({
        orderId: "123-4567890-1234567",
        marketplaceId: "ATVPDKIKX0DER",
        shipmentStatus: "PickedUp",
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("updated successfully");
      expect(mockAuth.makeAuthenticatedRequest).toHaveBeenCalledWith(
        "POST",
        "https://sellingpartnerapi-na.amazon.com/orders/v0/orders/123-4567890-1234567/shipment",
        {},
        expect.objectContaining({
          marketplaceId: "ATVPDKIKX0DER",
          shipmentStatus: "PickedUp",
        }),
      );
    });
  });

  describe("confirmShipment", () => {
    it("should successfully confirm shipment", async () => {
      mockAuth.makeAuthenticatedRequest.mockResolvedValueOnce({
        data: { success: true },
      } as any);

      const result = await ordersApiTool.confirmShipment({
        orderId: "123-4567890-1234567",
        marketplaceId: "ATVPDKIKX0DER",
        packageDetail: {
          packageReferenceId: "PKG123",
          carrierCode: "UPS",
          shipDate: "2025-01-20T00:00:00Z",
        },
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("confirmed successfully");
    });
  });
});
