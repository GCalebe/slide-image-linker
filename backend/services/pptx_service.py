from pathlib import Path
from typing import List, Tuple
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from PIL import Image
import io, json, tempfile

def extract_slide_png(pptx_path: Path, slide_number: int) -> Tuple[bytes, List[dict]]:
    """Renderiza slide em PNG e extrai bounding boxes aproximadas dos shapes de texto/imagem."""
    prs = Presentation(pptx_path)
    if slide_number < 1 or slide_number > len(prs.slides):
        slide_number = 1
    slide = prs.slides[slide_number - 1]
    # Renderização simples via pillow colored bg
    # python-pptx não renderiza nativamente; aqui devolvemos placeholder png
    width = prs.slide_width
    height = prs.slide_height
    img = Image.new('RGB', (width // 9525, height // 9525), color=(230, 230, 230))
    meta = []
    for shp in slide.shapes:
        if shp.shape_type in (MSO_SHAPE_TYPE.TEXT_BOX, MSO_SHAPE_TYPE.PLACEHOLDER, MSO_SHAPE_TYPE.PICTURE):
            rect = dict(id=f"Slide{slide_number}-{shp.shape_id}", x=shp.left//9525, y=shp.top//9525, w=shp.width//9525, h=shp.height//9525)
            meta.append(rect)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue(), meta

def apply_mappings_to_pptx(pptx_path: Path, mappings: List[dict]) -> bytes:
    """Aplica mapeamentos shape_id -> novo_texto (ou imagem futura)."""
    prs = Presentation(pptx_path)
    shape_map = {f"Slide{idx+1}-{shp.shape_id}": shp
                 for idx, slide in enumerate(prs.slides)
                 for shp in slide.shapes if shp.has_text_frame}
    for mp in mappings:
        sid = mp.get('shape_id')
        new_text = mp.get('new_text')
        if sid in shape_map and new_text:
            shape_map[sid].text = str(new_text)
    out_buf = io.BytesIO()
    prs.save(out_buf)
    return out_buf.getvalue()
