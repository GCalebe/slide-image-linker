# Slide‑Matcher Backend

Backend em FastAPI para o projeto Slide‑Matcher.

## Como rodar localmente

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Depois, abra o frontend configurado com `VITE_API_BASE=http://localhost:8000`.

## Variáveis de ambiente

| Nome | O que faz | Obrigatório |
|------|-----------|-------------|
| `OPENROUTER_API_KEY` | Chave da OpenRouter para OCR | Não (fallback sem IA) |

Crie um arquivo `.env` e exporte antes de rodar:

```bash
export OPENROUTER_API_KEY=sk-or-...
```

## Estrutura de Pastas

```
backend/
  app.py                  # Entrypoint FastAPI
  requirements.txt
  services/
    pptx_service.py
    vision_service.py
```
