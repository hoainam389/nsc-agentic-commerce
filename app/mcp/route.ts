import { baseURL } from "@/baseUrl";
import { getAuthorizeUrl, getOrderHistory } from "@/lib/api-service";
import { createMcpHandler } from "mcp-handler";
import { v4 as uuidv4 } from "uuid";
import redis from "@/lib/redis";

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

const handler = createMcpHandler(async (server) => {
  await registerLoginWidget(server);
  await registerOrderHistoryWidget(server);
});

export const GET = handler;
export const POST = handler;
