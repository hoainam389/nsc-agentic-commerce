import { baseURL } from "@/baseUrl";
import { getAuthorizeUrl, getOrderHistory, searchProducts, getProductDetail, getCart, addToCart, submitOrder } from "@/lib/api-service";
import { createMcpHandler } from "mcp-handler";
import { v4 as uuidv4 } from "uuid";
import redis from "@/lib/redis";
import { z } from "zod";

export const NEXT_PUBLIC_NSC_API_BASE_URL = process.env.NEXT_PUBLIC_NSC_API_BASE_URL;

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

async function getLoginToolResponse(sessionId?: string) {
  const currentSessionId = sessionId || uuidv4();
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
      sessionId: currentSessionId,
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
      inputSchema: {
        sessionId: z.string().optional().describe("The session ID. ALWAYS pass back the sessionId received from previous tool outputs to maintain the user's session."),
      },
      _meta: widgetMeta(loginWidget),
    },
    async ({ sessionId }: { sessionId?: string }) => {
      return await getLoginToolResponse(sessionId);
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
      inputSchema: {
        sessionId: z.string().optional().describe("The session ID. ALWAYS pass back the sessionId received from previous tool outputs to maintain the user's session."),
      },
      _meta: widgetMeta(orderHistoryWidget),
    },
    async ({ sessionId }: { sessionId?: string }) => {
      if (!sessionId) {
        return {
          content: [
            {
              type: "text",
              text: "Please log in to view your order history. Use the 'show_login' tool to sign in.",
            },
          ],
        };
      }
      const timestamp = new Date().toISOString();

      if (!redis) {
        return {
          content: [{ type: "text", text: "Error: Redis not configured." }],
        };
      }

      const authData = await redis.get(`auth:${sessionId}`);
      if (!authData) {
        // User is anonymous, return the login tool response
        return await getLoginToolResponse(sessionId);
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
        sessionId: z.string().optional().describe("The session ID. ALWAYS pass back the sessionId received from previous tool outputs to maintain the user's session."),
      },
      _meta: widgetMeta(listProductsWidget),
    },
    async ({ query, sessionId }: { query: string; sessionId?: string }) => {
      if (!sessionId) {
        return {
          content: [
            {
              type: "text",
              text: "Please log in to search for products. Use the 'show_login' tool to sign in.",
            },
          ],
        };
      }
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

async function registerProductDetailWidget(server: any) {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/products/detail");

  const productDetailWidget: ContentWidget = {
    id: "show_product_detail",
    title: "Product Detail",
    templateUri: "ui://widget/product-detail-template.html",
    invoking: "Loading product details...",
    invoked: "Product details loaded",
    html: html,
    description: "Display details for a specific product",
    widgetDomain: baseURL,
  };

  server.registerResource(
    "product-detail-widget",
    productDetailWidget.templateUri,
    {
      title: productDetailWidget.title,
      description: productDetailWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": productDetailWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${productDetailWidget.html}</html>`,
          _meta: {
            "openai/widgetCSP": {
              connect_domains: [
                productDetailWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              resource_domains: [
                productDetailWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              base_uri: [productDetailWidget.widgetDomain],
            },
            "openai/widgetDescription": productDetailWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": productDetailWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    productDetailWidget.id,
    {
      title: productDetailWidget.title,
      description: "Show details for a specific product. Use this tool when a user asks for more information about a product, wants to see its description, or wants to buy it.",
      inputSchema: {
        productName: z.string().describe("The exact display name of the product to show details for."),
        sessionId: z.string().optional().describe("The session ID. ALWAYS pass back the sessionId received from previous tool outputs to maintain the user's session."),
      },
      _meta: widgetMeta(productDetailWidget),
    },
    async ({ productName, sessionId }: { productName: string; sessionId?: string }) => {
      if (!sessionId) {
        return {
          content: [
            {
              type: "text",
              text: "Please log in to view product details. Use the 'show_login' tool to sign in.",
            },
          ],
        };
      }
      const timestamp = new Date().toISOString();

      try {
        console.log(`nsc-getting-product-detail for: ${productName}`);
        const productDetail = await getProductDetail(productName);
        
        return {
          structuredContent: {
            sessionId: sessionId,
            timestamp: timestamp,
            ...productDetail,
          },
          content: [
            {
              type: "text",
              text: `Here are the details for ${productDetail?.product?.displayName}.`,
            },
          ],
          _meta: widgetMeta(productDetailWidget),
        };
      } catch (error) {
        console.error("Error getting product detail:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to load product details. Please try again later.",
            },
          ],
        };
      }
    }
  );
}

async function registerCartWidget(server: any) {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/cart");

  const cartWidget: ContentWidget = {
    id: "show_cart",
    title: "Shopping Cart",
    templateUri: "ui://widget/cart-template.html",
    invoking: "Fetching your shopping cart...",
    invoked: "Shopping cart loaded",
    html: html,
    description: "Displays the items in the user's shopping cart along with summary and shipping details",
    widgetDomain: baseURL,
  };

  server.registerResource(
    "cart-widget",
    cartWidget.templateUri,
    {
      title: cartWidget.title,
      description: cartWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": cartWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${cartWidget.html}</html>`,
          _meta: {
            "openai/widgetCSP": {
              connect_domains: [
                cartWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              resource_domains: [
                cartWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              base_uri: [cartWidget.widgetDomain],
            },
            "openai/widgetDescription": cartWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": cartWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    cartWidget.id,
    {
      title: cartWidget.title,
      description: "Show the items in the user's shopping cart. Use this tool when the user wants to see their cart, review their order, or check shipping/payment details before checkout.",
      inputSchema: {
        sessionId: z.string().optional().describe("The session ID. ALWAYS pass back the sessionId received from previous tool outputs to maintain the user's session."),
      },
      _meta: widgetMeta(cartWidget),
    },
    async ({ sessionId }: { sessionId?: string }) => {
      if (!sessionId) {
        return {
          content: [
            {
              type: "text",
              text: "Please log in to view your shopping cart. Use the 'show_login' tool to sign in.",
            },
          ],
        };
      }
      const timestamp = new Date().toISOString();

      if (!redis) {
        return {
          content: [{ type: "text", text: "Error: Redis not configured." }],
        };
      }

      const authData = await redis.get(`auth:${sessionId}`);
      if (!authData) {
        return await getLoginToolResponse(sessionId);
      }

      try {
        const { customerId } = JSON.parse(authData);
        console.log(`nsc-loading-cart for customerId: ${customerId}`);
        const cartData = await getCart(customerId);

        return {
          structuredContent: {
            sessionId: sessionId,
            timestamp: timestamp,
            ...cartData,
          },
          content: [
            {
              type: "text",
              text: `Here is your shopping cart.`,
            },
          ],
          _meta: widgetMeta(cartWidget),
        };
      } catch (error) {
        console.error("Error fetching cart:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to fetch shopping cart. Please try again later.",
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "add_to_cart",
    {
      title: "Add to Cart",
      description: "Add a product variant to the shopping cart. Use this tool when the user clicks 'Add to Cart' or asks to add an item to their cart.",
      inputSchema: {
        variantCode: z.string().describe("The code of the product variant to add"),
        quantity: z.number().describe("The quantity to add"),
        sessionId: z.string().optional().describe("The session ID. ALWAYS pass back the sessionId received from previous tool outputs to maintain the user's session."),
      },
    },
    async ({ variantCode, quantity, sessionId }: { variantCode: string; quantity: number; sessionId?: string }) => {
      if (!sessionId) {
        return {
          content: [
            {
              type: "text",
              text: "Please log in to add items to your cart. Use the 'show_login' tool to sign in.",
            },
          ],
        };
      }
      if (!redis) {
        return { content: [{ type: "text", text: "Error: Redis not configured." }] };
      }

      const authData = await redis.get(`auth:${sessionId}`);
      if (!authData) {
        return await getLoginToolResponse(sessionId);
      }

      try {
        const { customerId } = JSON.parse(authData);
        console.log(`nsc-adding-to-cart: variant ${variantCode}, qty ${quantity} for customer ${customerId}`);
        
        // Call the backend to add to cart
        const response = await addToCart(customerId, variantCode, quantity);

        if (!response.ok) {
          throw new Error("Failed to add to cart");
        }

        const cartData = await response.json();

        return {
          structuredContent: {
            sessionId: sessionId,
            ...cartData,
          },
          content: [{ type: "text", text: `Added ${quantity} item(s) to your cart.` }],
        };
      } catch (error) {
        console.error("Error adding to cart:", error);
        return { content: [{ type: "text", text: "Failed to add item to cart." }] };
      }
    }
  );
}

async function registerCheckoutWidget(server: any) {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/check-out");

  const checkoutWidget: ContentWidget = {
    id: "submit_order",
    title: "Order Confirmation",
    templateUri: "ui://widget/checkout-template.html",
    invoking: "Submitting your order...",
    invoked: "Order submitted successfully",
    html: html,
    description: "Displays the order confirmation after a successful checkout",
    widgetDomain: baseURL,
  };

  server.registerResource(
    "checkout-widget",
    checkoutWidget.templateUri,
    {
      title: checkoutWidget.title,
      description: checkoutWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": checkoutWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${checkoutWidget.html}</html>`,
          _meta: {
            "openai/widgetCSP": {
              connect_domains: [
                checkoutWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              resource_domains: [
                checkoutWidget.widgetDomain,
                NEXT_PUBLIC_NSC_API_BASE_URL,
              ],
              base_uri: [checkoutWidget.widgetDomain],
            },
            "openai/widgetDescription": checkoutWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": checkoutWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    checkoutWidget.id,
    {
      title: "Submit Order",
      description: "Submit the order for the items in the cart. Use this tool when the user says they want to checkout, place order, or complete their purchase.",
      inputSchema: {
        sessionId: z.string().optional().describe("The session ID. ALWAYS pass back the sessionId received from previous tool outputs to maintain the user's session."),
      },
      _meta: widgetMeta(checkoutWidget),
    },
    async ({ sessionId }: { sessionId?: string }) => {
      if (!sessionId) {
        return {
          content: [
            {
              type: "text",
              text: "Please log in to submit your order. Use the 'show_login' tool to sign in.",
            },
          ],
        };
      }
      const timestamp = new Date().toISOString();

      if (!redis) {
        return {
          content: [{ type: "text", text: "Error: Redis not configured." }],
        };
      }

      const authData = await redis.get(`auth:${sessionId}`);
      if (!authData) {
        return await getLoginToolResponse(sessionId);
      }

      try {
        const { token, customerId } = JSON.parse(authData);
        console.log(`nsc-submitting-order for customerId: ${customerId}`);
        const orderConfirmation = await submitOrder(token, customerId);

        return {
          structuredContent: {
            sessionId: sessionId,
            timestamp: timestamp,
            ...orderConfirmation,
          },
          content: [
            {
              type: "text",
              text: `Order submitted successfully! Your order number is ${orderConfirmation.orderNumber}.`,
            },
          ],
          _meta: widgetMeta(checkoutWidget),
        };
      } catch (error) {
        console.error("Error submitting order:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to submit order. Please try again later.",
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
  await registerProductDetailWidget(server);
  await registerCartWidget(server);
  await registerCheckoutWidget(server);
});

export const GET = handler;
export const POST = handler;

