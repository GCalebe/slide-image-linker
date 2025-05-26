from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from pathlib import Path
from typing import Dict, List
import io, json, os, tempfile

from services.pptx_service import extract_slide_png, apply_mappings_to_pptx
from services.vision_service import detect_boxes_ocr

TEMP_DIR = Path(tempfile.gettempdir()) / "slide_matcher"
TEMP_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Slide‑Matcher Backend", version="0.1.0")

# CORS (ajuste origin conforme seu front em prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pptx_store: Dict[str, Path] = {}
image_store: Dict[str, Path] = {}
mappings_store: Dict[str, List[dict]] = {}

# ----------- PPTX -----------
@app.post("/api/upload-pptx")
async def upload_pptx(file: UploadFile = File(...)):
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Apenas arquivos .pptx")
    pptx_id = str(uuid4())[:8]
    dest = TEMP_DIR / f"{pptx_id}.pptx"
    with dest.open("wb") as f:
        f.write(await file.read())
    pptx_store[pptx_id] = dest
    return {"pptx_id": pptx_id}

@app.get("/api/slide/{pptx_id}/{n}")
def get_slide(pptx_id: str, n: int):
    if pptx_id not in pptx_store:
        raise HTTPException(status_code=404, detail="pptx_id não encontrado")
    png_bytes, shapes_meta = extract_slide_png(pptx_store[pptx_id], n)
    headers = {"X-Shape-Meta": json.dumps(shapes_meta)}
    return StreamingResponse(io.BytesIO(png_bytes), media_type="image/png", headers=headers)

# ----------- Imagens Externas -----------
@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    img_id = str(uuid4())[:8]
    dest = TEMP_DIR / f"{img_id}_{file.filename}"
    with dest.open("wb") as f:
        f.write(await file.read())
    image_store[img_id] = dest
    return {"img_id": img_id}

@app.get("/api/image/{img_id}")
def get_image(img_id: str):
    if img_id not in image_store:
        raise HTTPException(status_code=404, detail="img_id não encontrado")
    boxes = detect_boxes_ocr(image_store[img_id])
    with image_store[img_id].open("rb") as f:
        img_bytes = f.read()
    headers = {"X-Box-Meta": json.dumps(boxes)}
    return StreamingResponse(io.BytesIO(img_bytes), headers=headers, media_type="image/png")

# ----------- Mapeamentos -----------
@app.post("/api/mappings/{pptx_id}")
async def save_mappings(pptx_id: str, data: List[dict]):
    mappings_store[pptx_id] = data
    return {"status": "ok"}

@app.post("/api/apply-mappings/{pptx_id}")
def apply_mappings(pptx_id: str):
    if pptx_id not in pptx_store:
        raise HTTPException(status_code=404, detail="pptx_id não encontrado")
    mappings = mappings_store.get(pptx_id, [])
    output_bytes = apply_mappings_to_pptx(pptx_store[pptx_id], mappings)
    return StreamingResponse(io.BytesIO(output_bytes), media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", headers={"Content-Disposition": f"attachment; filename={pptx_id}_updated.pptx"})
