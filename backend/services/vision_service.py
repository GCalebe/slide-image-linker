from pathlib import Path
from typing import List
import base64, os, requests, json

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions"

def detect_boxes_ocr(img_path: Path) -> List[dict]:
    """Envia imagem ao modelo 'mistral-vision-ocr' via OpenRouter e devolve caixas."""
    if OPENROUTER_API_KEY is None:
        # Fallback: retorna caixa única
        return [dict(id="ImgBox1", x=0, y=0, w=100, h=50, text="fallback")]
    with img_path.open('rb') as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
    payload = {
        "model": "mistral-vision-ocr",
        "messages": [
            {"role": "user", "content": [{"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}, {"type": "text", "text": "Return OCR bounding boxes as JSON list with id, x, y, w, h, text"}]}
        ],
        "max_tokens": 512
    }
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}"}
    resp = requests.post(OPENROUTER_BASE, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    # Esperamos que o modelo retorne JSON
    try:
        boxes = json.loads(content)
        return boxes
    except Exception:
        return []
