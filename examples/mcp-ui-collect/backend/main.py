import logging
import os

import httpx
import uvicorn
from fastmcp import Context, FastMCP
from mcp.types import EmbeddedResource, TextResourceContents
from pydantic import AnyUrl
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import HTMLResponse, JSONResponse, PlainTextResponse

CLIENT_ID = os.environ.get("VGS_CLIENT_ID")
CLIENT_SECRET = os.environ.get("VGS_CLIENT_SECRET")
TOKEN_URL = (
    "https://auth.verygoodsecurity.com/auth/realms/vgs/protocol/openid-connect/token"
)

logger = logging.getLogger(__name__)

mcp = FastMCP("VGS MCP UI Demo 🚀🔒", stateless_http=True)


@mcp.tool()
def hello_world(ctx: Context):
    """Provides a hello world UI component."""
    ctx.report_progress(progress=0, total=100)

    yield "interim result"

    yield EmbeddedResource(
        type="resource",
        resource=TextResourceContents(
            uri=AnyUrl("ui://hello-world/greeting"),
            mimeType="text/html",
            text="""
                <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center;">
                  <h1>Hello World! 👋</h1>
                  <p>Welcome to MCP UI!</p>
                  <button onclick="window.parent.postMessage({type: 'ui-action', action: 'greeting-clicked'}, '*')" 
                          style="background: white; color: #667eea; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    Click me!
                  </button>
                </div>
                """,
        ),
    )


@mcp.tool()
def hello(ctx: Context):
    return EmbeddedResource(
        type="resource",
        resource=TextResourceContents(
            uri=AnyUrl("ui://hello-world/hello"),
            mimeType="text/html",
            text="""
        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center;">
          <h1>Hello World! 👋</h1>
          <p>Welcome to MCP UI!</p>
          <button onclick="window.parent.postMessage({type: 'ui-action', action: 'greeting-clicked'}, '*')" 
                  style="background: white; color: #667eea; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
            Click me!
          </button>
        </div>
""",
        ),
    )


@mcp.tool()
def form(ctx: Context):
    return EmbeddedResource(
        type="resource",
        resource=TextResourceContents(
            uri=AnyUrl("ui://hello-world/form"),
            mimeType="text/html",
            text="""
        <div style="padding: 20px; background: #f8f9fa; border-radius: 10px; border: 1px solid #dee2e6;">
          <h2>Contact Form</h2>
          <form onsubmit="event.preventDefault(); window.parent.postMessage({type: 'ui-action', action: 'form-submitted', data: {name: document.getElementById('name').value, email: document.getElementById('email').value}}, '*')">
            <div style="margin-bottom: 15px;">
              <label for="name" style="display: block; margin-bottom: 5px; font-weight: bold;">Name:</label>
              <input type="text" id="name" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
              <label for="email" style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
              <input type="email" id="email" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <button type="submit" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
              Submit
            </button>
          </form>
        </div>
""",
        ),
    )


@mcp.tool()
def chart(ctx: Context):
    return EmbeddedResource(
        type="resource",
        resource=TextResourceContents(
            uri=AnyUrl("ui://hello-world/chart"),
            mimeType="text/html",
            text="""
        <div style="padding: 20px; background: white; border-radius: 10px; border: 1px solid #dee2e6;">
          <h2>Sample Chart</h2>
          <div style="display: flex; align-items: end; justify-content: center; height: 200px; gap: 10px; margin: 20px 0;">
            <div style="background: #ff6b6b; width: 40px; height: 60px; border-radius: 4px;"></div>
            <div style="background: #4ecdc4; width: 40px; height: 100px; border-radius: 4px;"></div>
            <div style="background: #45b7d1; width: 40px; height: 80px; border-radius: 4px;"></div>
            <div style="background: #96ceb4; width: 40px; height: 120px; border-radius: 4px;"></div>
            <div style="background: #feca57; width: 40px; height: 90px; border-radius: 4px;"></div>
          </div>
          <p style="text-align: center; color: #666;">Sample data visualization</p>
        </div>
""",
        ),
    )


@mcp.tool()
def collect(ctx: Context):
    return (
        "Please provide your card details so we can perform a purchase on your behalf",
        EmbeddedResource(
            type="resource",
            resource=TextResourceContents(
                uri=AnyUrl("ui://vgs-collect-form"),
                mimeType="text/uri-list",
                text="http://localhost:8080/collect.html",
            ),
        ),
    )


# Define a resource using the @mcp.resource decorator
# This resource will be accessible at the URI "resource://my-http-data"
@mcp.resource(
    "resource://my-http-data",
    description="Provides sample HTTP data.",
    mime_type="text/html",
)
def get_http_data() -> dict:
    """
    Returns a dictionary representing some HTTP-related information.
    """
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
"""
    return html


async def get_collect_page(request):
    return HTMLResponse(open("collect.html", "r").read())


async def get_collect_token(request):
    try:
        params = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "client_credentials",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(TOKEN_URL, data=params)
            response.raise_for_status()
            return JSONResponse({"access_token": response.json()["access_token"]})

    except Exception as error:
        print(f"Error getting VGS token: {str(error)}")
        return JSONResponse({"error": "Failed to get token"}, status_code=500)


async def get_script(request):
    return PlainTextResponse(open("script.js", "r").read())


custom_middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

http_app = mcp.http_app(middleware=custom_middleware)
http_app.add_route("/get-collect-token", get_collect_token)
http_app.add_route("/script.js", get_script)
http_app.add_route("/collect.html", get_collect_page)


if __name__ == "__main__":
    uvicorn.run(http_app, host="0.0.0.0", port=8080)
