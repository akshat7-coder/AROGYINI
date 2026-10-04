# AROGYINI — legal RAG bot

FastAPI service on **port 8002**. Answers questions about Indian women's law from the Acts
stored in this folder as `.txt`, retrieved from a local **Chroma** index.

AROGYINI's backend calls this bot as the `legal` bot (`LEGAL_BOT_URL`, default
`http://localhost:8002`).

## API

| Route | Purpose |
|---|---|
| `GET /health` | `{"status":"ok","ready":true|false,"reason":...,"chunks":N,"embedding_model":...,"model":...}` |
| `POST /ask` | `{"question":"..."}` → `{"answer":"...","sources":[{"title":"<Act>","source":"<file>"}]}` |
| `GET /` | a one-line liveness message |

`/ask` returns **400** `{"error":"question is required"}` for an empty question and **503**
`{"error":"<reason>"}` when the index is missing, was built with different embeddings, or the
LLM call fails. Errors are always JSON.

## Providers

Both are picked from the environment, so the bot can run on a free Groq key alone:

| Variable | Values | Default |
|---|---|---|
| `LLM_PROVIDER` | `openai` \| `groq` | `openai` |
| `LLM_MODEL` | any model of that provider | `gpt-4o-mini` / `llama-3.1-8b-instant` |
| `EMBEDDINGS` | `openai` \| `huggingface` | `openai` |

`EMBEDDINGS=huggingface` embeds locally with `all-MiniLM-L6-v2` and needs no key, so
`LLM_PROVIDER=groq` + `EMBEDDINGS=huggingface` runs the whole bot on one free Groq key.

`embeddings/manifest.json` records which embedding model built the index. If it no longer
matches `EMBEDDINGS`, `/health` reports `ready: false` and `/ask` returns 503 asking you to
rebuild — the vectors would otherwise be silently meaningless.

## Setup

```bash
cd bots/legal
python -m venv .venv
.venv\Scripts\activate          # Windows;  source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env            # then fill in a key
```

## Build the index

```bash
python build_index.py
```

This replaces the old `1_extract_text.py` / `2_chunk_text.py` / `3_generate_embeddings.py`
scripts, which have been removed. It reads every `.txt` Act in this folder plus any PDFs in
`data/pdfs/`, warns about and skips files with no extractable text
(`The_Criminal_Law_Amendment_Act_2013_0.txt` is empty), splits at 1000 characters with 200
overlap, tags each chunk with its `source` file and readable `act` name, writes the vectors to
`embeddings/vectors/` and the manifest to `embeddings/manifest.json`.

The `.pdf` files in this folder are the originals of the `.txt` ones and are **not** indexed
again. Re-run `build_index.py` any time you add an Act or change `EMBEDDINGS`.

## Run

```bash
python server.py                   # http://localhost:8002
```

## Check

```bash
curl http://localhost:8002/health
curl -X POST http://localhost:8002/ask -H "Content-Type: application/json" -d "{\"question\":\"What is sexual harassment at work?\"}"
```

`chat.html` and `chatbot.html` are standalone pages that post to this bot on
`http://localhost:8002`; open either file directly in a browser.

## Tests

```bash
pytest
```

Retrieval and the LLM call are monkeypatched, so the tests need no keys and no network.
