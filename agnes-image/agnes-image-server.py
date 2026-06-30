import os
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Agnes Image 2.1 Flash")

AGNES_API_URL = "https://apihub.agnes-ai.com/v1/images/generations"

@mcp.tool()
async def generate_image(
    prompt: str,
    size: str = "1024x768",
    image_url: str = "",
    response_format: str = "url"
) -> str:
    """Generate or edit images using Agnes Image 2.1 Flash model.

    Args:
        prompt: Text description of the image to generate (or edit instruction for img2img)
        size: Image dimensions, e.g. "1024x768"
        image_url: Optional public URL of an input image for image-to-image editing
        response_format: "url" to return a public image URL, or "b64_json" for base64 encoded image data
    """
    api_key = os.environ.get("AGNES_API_KEY")
    if not api_key:
        return "Error: AGNES_API_KEY environment variable is not set"

    payload = {
        "model": "agnes-image-2.1-flash",
        "prompt": prompt,
        "size": size,
    }

    if image_url:
        # Image-to-image
        payload["extra_body"] = {
            "image": [image_url],
            "response_format": response_format,
        }
    elif response_format == "b64_json":
        # Text-to-image, base64 output
        payload["return_base64"] = True
    else:
        # Text-to-image, URL output
        payload["extra_body"] = {
            "response_format": "url",
        }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            AGNES_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=300.0,
        )

    if resp.status_code != 200:
        return f"Error: API returned {resp.status_code}: {resp.text}"

    data = resp.json()
    result = data["data"][0]

    url = result.get("url")
    if url:
        return url

    b64 = result.get("b64_json")
    if b64:
        return f"data:image/png;base64,{b64}"

    revised = result.get("revised_prompt")
    if revised:
        return f"Revised prompt: {revised}"

    return str(data)


if __name__ == "__main__":
    mcp.run(transport="stdio")
