import { baseURL } from "@/baseUrl";
import { getAuthorizeUrl, getOrderHistory, searchProducts } from "@/lib/api-service";
import { createMcpHandler } from "mcp-handler";
import { v4 as uuidv4 } from "uuid";
import redis from "@/lib/redis";
import { z } from "zod";

export const NEXT_PUBLIC_NSC_API_BASE_URL = process.env.NEXT_PUBLIC_NSC_API_BASE_URL;

// Use a session ID derived from the conversation to ensure consistency across tools
const sessionId = uuidv4();

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

async function getLoginToolResponse() {
  const { authorizeUrl } = await getAuthorizeUrl();
  const timestamp = new Date().toISOString();

  const loginWidget: ContentWidget = {
    id: "show_login",
    title: "Show Login",
    templateUri: "ui://widget/login-template.html",
    invoking: "Loading login view...",
    invoked: "Login view loaded",
    html: "", // Not needed for the tool response metadata
    description: "Displays the login page with a login button",
    widgetDomain: baseURL,
  };

  return {
    structuredContent: {
      authorizeUrl: authorizeUrl,
      sessionId: sessionId,
      timestamp: timestamp,
    },
    content: [
      {
        type: "text",
        text: `Please sign in using the button below to view your order history.`,
      },
    ],
    _meta: widgetMeta(loginWidget),
  };
}

async function registerLoginWidget(server: any) {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/login");

  const loginWidget: ContentWidget = {
    id: "show_login",
    title: "Show Login",
    templateUri: "ui://widget/login-template.html",
    invoking: "Loading login view...",
    invoked: "Login view loaded",
    html: html,
    description: "Displays the login page with a login button",
    widgetDomain: baseURL,
  };

  server.registerResource(
    "login-widget",
    loginWidget.templateUri,
    {
      title: loginWidget.title,
      description: loginWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": loginWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${loginWidget.html}</html>`,
          _meta: {
            "openai/widgetCSP": {
              connect_domains: [
                loginWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              resource_domains: [
                loginWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
            },
            "openai/widgetDescription": loginWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": loginWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    loginWidget.id,
    {
      title: loginWidget.title,
      description: "Display the login page to the user",
      inputSchema: {},
      _meta: widgetMeta(loginWidget),
    },
    async () => {
      return await getLoginToolResponse();
    }
  );
}

async function registerOrderHistoryWidget(server: any) {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/order-history");

  const orderHistoryWidget: ContentWidget = {
    id: "show_order_history",
    title: "Order History",
    templateUri: "ui://widget/order-history-template.html",
    invoking: "Fetching your order history...",
    invoked: "Order history loaded",
    html: html,
    description: "Displays the user's recent order history",
    widgetDomain: baseURL,
  };

  server.registerResource(
    "order-history-widget",
    orderHistoryWidget.templateUri,
    {
      title: orderHistoryWidget.title,
      description: orderHistoryWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": orderHistoryWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${orderHistoryWidget.html}</html>`,
          _meta: {
            "openai/widgetCSP": {
              connect_domains: [
                orderHistoryWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              resource_domains: [
                orderHistoryWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              base_uri: [orderHistoryWidget.widgetDomain],
            },
            "openai/widgetDescription": orderHistoryWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": orderHistoryWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    orderHistoryWidget.id,
    {
      title: orderHistoryWidget.title,
      description: "Show the user's order history",
      inputSchema: {},
      _meta: widgetMeta(orderHistoryWidget),
    },
    async () => {
      const timestamp = new Date().toISOString();

      if (!redis) {
        return {
          content: [{ type: "text", text: "Error: Redis not configured." }],
        };
      }

      const authData = await redis.get(`auth:${sessionId}`);
      if (!authData) {
        // User is anonymous, return the login tool response
        return await getLoginToolResponse();
      }

      try {
        const { token, customerId } = JSON.parse(authData);
        console.log(`nsc-loading-order-history for customerId: ${customerId}`);
        const orderHistory = await getOrderHistory(token, customerId);

        console.log("nsc-order-history-response", orderHistory);

        return {
          structuredContent: {
            sessionId: sessionId,
            timestamp: timestamp,
            orders: orderHistory.orders || [],
          },
          content: [
            {
              type: "text",
              text: `Here is your order history.`,
            },
          ],
          _meta: widgetMeta(orderHistoryWidget),
        };
      } catch (error) {
        console.error("Error fetching order history:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to fetch order history. You might need to log in again.",
            },
          ],
        };
      }
    }
  );
}

async function registerListProductsWidget(server: any) {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/products");

  const listProductsWidget: ContentWidget = {
    id: "list_products",
    title: "List Products",
    templateUri: "ui://widget/list-products-template.html",
    invoking: "Listing products...",
    invoked: "Products listed",
    html: html,
    description: "List products based on a query",
    widgetDomain: baseURL,
  };

  server.registerResource(
    "list-products-widget",
    listProductsWidget.templateUri,
    {
      title: listProductsWidget.title,
      description: listProductsWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": listProductsWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${listProductsWidget.html}</html>`,
          _meta: {
            "openai/widgetCSP": {
              connect_domains: [
                listProductsWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              resource_domains: [
                listProductsWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              base_uri: [listProductsWidget.widgetDomain],
            },
            "openai/widgetDescription": listProductsWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": listProductsWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    listProductsWidget.id,
    {
      title: listProductsWidget.title,
      description: "List products in the catalog. Use this tool whenever the user wants to search, find, browse, or list products. It supports listing by keywords, categories, and specific attributes like 'Incontinence Type' or 'Absorbency' (e.g., 'Booster Pads for Urinary Only').",
      inputSchema: {
        query: z.string().describe("The search or listing query string. Combine keywords and any specific requirements or filters mentioned by the user (e.g., 'Booster Pads for Urinary Only')."),
      },
      _meta: widgetMeta(listProductsWidget),
    },
    async ({ query }: { query: string }) => {
      const timestamp = new Date().toISOString();

      try {
        console.log(`nsc-listing-products for query: ${query}`);
        const searchResult = await searchProducts(query);

        console.log("nsc-search-result-response", searchResult);

        return {
          structuredContent: {
            sessionId: sessionId,
            timestamp: timestamp,
            ...searchResult,
          },
          content: [
            {
              type: "text",
              text: `Here are the products for "${query}".`,
            },
          ],
          _meta: widgetMeta(listProductsWidget),
        };
      } catch (error) {
        console.error("Error listing products:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to list products. Please try again later.",
            },
          ],
        };
      }
    }
  );
}

const handler = createMcpHandler(async (server) => {
  await registerLoginWidget(server);
  await registerOrderHistoryWidget(server);
  await registerListProductsWidget(server);
});

export const GET = handler;
export const POST = handler;
