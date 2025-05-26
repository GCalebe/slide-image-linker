
from pathlib import Path
import base64, os, asyncio
from typing import List
import httpx

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

async def _request_ocr(image_b64: str) -> dict:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "mistral-vision-ocr",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{image_b64}"},
                    }
                ],
            }
        ],
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers
        )
        r.raise_for_status()
        return r.json()

def detect_boxes_ocr(image_path: Path) -> List[dict]:
    """Chama OpenRouter OCR e devolve lista de boxes; fallback única box."""
    try:
        with image_path.open("rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()
        data = asyncio.run(_request_ocr(img_b64))
        boxes = []
        # Convert output (depende do formato do modelo)
        idx = 1
        for ch in data.get("choices", []):
            annotations = ch.get("message", {}).get("annotations", [])
            for ann in annotations:
                bbox = ann.get("bounding_box", {})
                boxes.append(
                    {
                        "id": f"ImgBox{idx}",
                        "x": bbox.get("x", 0),
                        "y": bbox.get("y", 0),
                        "w": bbox.get("w", 100),
                        "h": bbox.get("h", 20),
                        "text": ann.get("text", ""),
                    }
                )
                idx += 1
        if boxes:
            return boxes
    except Exception as e:
        print("OCR error:", e)

    # Fallback: box total
    return [{"id": "ImgBox1", "x": 0, "y": 0, "w": 100, "h": 30, "text": ""}]
