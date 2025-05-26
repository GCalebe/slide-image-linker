
# Slide‑Matcher Backend

### Executar localmente

```bash
python -m venv venv && source venv/bin/activate  # (Windows use venv\Scripts\activate)
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Defina sua chave do OpenRouter em `.env` ou como variável de ambiente:

```
OPENROUTER_API_KEY=sk-or-xxxxxxxx
```

### Deploy no Railway

1. Conecte o repositório e selecione Python.
2. Start Command:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port $PORT
   ```
3. Em **Variables**, adicione `OPENROUTER_API_KEY`.
