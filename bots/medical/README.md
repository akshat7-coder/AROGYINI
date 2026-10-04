# AROGYINI — medical RAG bot

Flask service on **port 5000**. Answers women's health questions from the PDFs in `data/`,
retrieved from a Pinecone index and summarised by **Gemini** (or Groq).

AROGYINI's backend calls this bot as the `medical` bot (`MEDICAL_BOT_URL`, default
`http://localhost:5000`).

## API

| Route | Purpose |
|---|---|
| `GET /health` | `{"status":"ok","ready":true|false,"reason":...,"index":...,"vectors":N,"model":...}` |
| `POST /ask` | `{"question":"..."}` → `{"answer":"...","sources":[{"title":"...","source":"..."}]}` |
| `GET /` | the bundled chat UI (`templates/chat.html`) |
| `POST /get` | form field `msg`, returns plain text — used by that UI |

`/ask` returns **400** `{"error":"question is required"}` for an empty question and **503**
`{"error":"<reason>"}` when the index is missing or Groq fails. Errors are always JSON,
never an HTML page.

## Setup

```bash
cd bots/medical
python -m venv .venv
.venv\Scripts\activate          # Windows;  source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env            # then fill in the two keys
```

Keys needed (both have a free tier):
- `PINECONE_API_KEY` — https://app.pinecone.io
- the key for your LLM provider, below

## LLM provider

| Variable | Values | Default |
|---|---|---|
| `LLM_PROVIDER` | `gemini` \| `groq` | `gemini` |
| `LLM_MODEL` | any model of that provider | `gemini-2.5-flash` / `llama-3.1-8b-instant` |

`gemini` needs `GEMINI_API_KEY` (https://aistudio.google.com/apikey), `groq` needs
`GROQ_API_KEY` (https://console.groq.com/keys). Both are reached through their
OpenAI-compatible chat-completions endpoint, so it is one code path either way.

## Build the index

`data/` must hold at least one PDF (`Medical_book.pdf` ships with the repo).

```bash
python store_index.py              # creates the index if missing, skips if it has vectors
python store_index.py --rebuild    # wipe and re-upload
```

The index is created with 384 dimensions and cosine distance to match
`sentence-transformers/all-MiniLM-L6-v2`. Change the model and you must `--rebuild`.

## Retrieval tuning

`CHUNK_SIZE` / `CHUNK_OVERLAP` in `src/helper.py` are 1000/200. Changing either means
`--rebuild`, since the stored vectors are per chunk. `TOP_K` (env, default 10) is how many
chunks are sent to the model and can be changed without rebuilding: smaller chunks or a
small `TOP_K` leave the model too little context and it will answer that it does not know.

## Run

```bash
python app.py                      # http://localhost:5000
```

## Check

```bash
curl http://localhost:5000/health
curl -X POST http://localhost:5000/ask -H "Content-Type: application/json" -d "{\"question\":\"What causes anaemia?\"}"
```

## Tests

```bash
pytest
```

Retrieval and the LLM call are monkeypatched, so the tests need no keys and no network.
