import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from openai import OpenAI
from pinecone import Pinecone

from src.helper import EMBEDDING_MODEL, download_hugging_face_embeddings
from src.prompt import SYSTEM_PROMPT

load_dotenv()

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "medical-chatbot")
# 500-char chunks are small, so k=3 gave the model ~1.4k chars to work with. Tune per index.
TOP_K = int(os.getenv("TOP_K", "10"))

# Gemini and Groq both speak the OpenAI chat-completions API, so one client covers both.
PROVIDERS = {
    "gemini": ("https://generativelanguage.googleapis.com/v1beta/openai/", "GEMINI_API_KEY", "gemini-2.5-flash"),
    "groq": ("https://api.groq.com/openai/v1", "GROQ_API_KEY", "openai/gpt-oss-120b"),
}
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").strip().lower()

app = Flask(__name__)

# Everything expensive lives here and is filled in once by _startup() below.
state = {"ready": False, "reason": "not initialised", "vectors": 0, "model": ""}
_embeddings = None
_index = None
_llm = None
_model = ""


def _startup() -> None:
    """Load the embedding model, Pinecone index and LLM client once, at import."""
    global _embeddings, _index, _llm, _model

    if LLM_PROVIDER not in PROVIDERS:
        state["reason"] = f"LLM_PROVIDER must be one of {sorted(PROVIDERS)}, not {LLM_PROVIDER!r}"
        return
    base_url, key_var, default_model = PROVIDERS[LLM_PROVIDER]
    _model = os.getenv("LLM_MODEL") or default_model
    state["model"] = f"{LLM_PROVIDER}/{_model}"

    pinecone_key = os.getenv("PINECONE_API_KEY")
    llm_key = os.getenv(key_var)
    if not pinecone_key:
        state["reason"] = "PINECONE_API_KEY is not set"
        return
    if not llm_key:
        state["reason"] = f"LLM_PROVIDER={LLM_PROVIDER} needs {key_var}"
        return

    try:
        pc = Pinecone(api_key=pinecone_key)
        if not pc.has_index(INDEX_NAME):
            state["reason"] = f"Pinecone index '{INDEX_NAME}' does not exist. Run store_index.py"
            return
        _index = pc.Index(INDEX_NAME)
        state["vectors"] = _index.describe_index_stats().get("total_vector_count", 0)
        if not state["vectors"]:
            state["reason"] = f"Pinecone index '{INDEX_NAME}' is empty. Run store_index.py"
            return
    except Exception as exc:
        state["reason"] = f"Cannot reach Pinecone: {exc}"
        return

    print(f"Loading embedding model {EMBEDDING_MODEL}...")
    _embeddings = download_hugging_face_embeddings()
    _llm = OpenAI(api_key=llm_key, base_url=base_url)
    state["ready"] = True
    state["reason"] = "ok"
    print(f"Ready. Index '{INDEX_NAME}' holds {state['vectors']} vectors, LLM {state['model']}.")


def retrieve(question: str) -> list[dict]:
    hits = _index.query(
        vector=_embeddings.embed_query(question),
        top_k=TOP_K,
        include_metadata=True,
    )
    return [h.get("metadata") or {} for h in hits.get("matches", [])]


def complete(question: str, docs: list[dict]) -> str:
    context = "\n\n".join(d.get("text", "") for d in docs) or "No reference material found."
    reply = _llm.chat.completions.create(
        model=_model,
        temperature=0.3,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
            {"role": "user", "content": question},
        ],
    )
    return (reply.choices[0].message.content or "").strip()


def _sources(docs: list[dict]) -> list[dict]:
    seen, out = set(), []
    for doc in docs:
        source = doc.get("source") or ""
        if source and source not in seen:
            seen.add(source)
            out.append({"title": Path(source).stem.replace("_", " "), "source": source})
    return out


def _answer(question: str) -> tuple[str, list[dict]]:
    docs = retrieve(question)
    return complete(question, docs).strip(), _sources(docs)


@app.get("/health")
def health():
    return jsonify(
        status="ok",
        ready=state["ready"],
        reason=state["reason"],
        index=INDEX_NAME,
        vectors=state["vectors"],
        model=state["model"],
        embedding_model=EMBEDDING_MODEL,
    )


@app.post("/ask")
def ask():
    question = ((request.get_json(silent=True) or {}).get("question") or "").strip()
    if not question:
        return jsonify(error="question is required"), 400
    if not state["ready"]:
        return jsonify(error=state["reason"]), 503

    try:
        answer, sources = _answer(question)
    except Exception as exc:
        return jsonify(error=f"the medical assistant is unavailable: {exc}"), 503
    if not answer:
        return jsonify(error="the medical assistant returned an empty answer"), 503
    return jsonify(answer=answer, sources=sources)


@app.get("/")
def index():
    return render_template("chat.html")


@app.post("/get")
def get():
    """Plain-text route the bundled chat.html UI posts to."""
    question = (request.form.get("msg") or "").strip()
    if not question:
        return "Please type a question."
    if not state["ready"]:
        return f"The assistant is not ready: {state['reason']}"
    try:
        return _answer(question)[0]
    except Exception as exc:
        return f"Sorry, something went wrong: {exc}"


@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(500)
def _json_errors(err):
    code = getattr(err, "code", 500)
    return jsonify(error=getattr(err, "description", "internal error")), code


_startup()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
