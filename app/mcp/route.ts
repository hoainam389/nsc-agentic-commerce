import { baseURL } from "@/baseUrl";
import { getAuthorizeUrl } from "@/lib/api-service";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const NEXT_PUBLIC_NSC_API_BASE_URL = process.env.NEXT_PUBLIC_NSC_API_BASE_URL;

// Generate a stable sessionId for the server instance
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

async function registerContentWidget(server: any) {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");

  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the homepage content",
    widgetDomain: "https://nextjs.org/docs",
  };
  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description:
        "Fetch and display the homepage content with the name of the user",
      inputSchema: {
        name: z.string().describe("The name of the user to display on the homepage"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name }: { name: string }) => {
      return {
        content: [
          {
            type: "text",
            text: name,
          },
        ],
        structuredContent: {
          name: name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );
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
      const { authorizeUrl } = await getAuthorizeUrl();
      const timestamp = new Date().toISOString();

      return {
        structuredContent: {
          authorizeUrl: authorizeUrl,
          sessionId: sessionId,
          timestamp: timestamp,
        },
        content: [
          {
            type: "text",
            text: `Please sign in using the button below.`,
          },
        ],
        _meta: widgetMeta(loginWidget),
      };
    }
  );
}

const handler = createMcpHandler(async (server) => {
  await registerContentWidget(server);
  await registerLoginWidget(server);
});

export const GET = handler;
export const POST = handler;
