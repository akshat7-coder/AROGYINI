"""Loads the Chroma index and the LLM client once at import; ask_question() does the rest."""
import json
import os

from dotenv import load_dotenv

from config import MANIFEST, PERSIST_DIR, build_embeddings, embedding_id, llm_config

load_dotenv()

TOP_K = 3

PROMPT = """You are a legal assistant for AROGYINI, an app for women in India. Answer using \
ONLY the extracts from Indian Acts given below.

Rules:
- Name the Act and, where the extract shows it, the section you are relying on.
- If the extracts do not cover the question, say exactly that the Acts available to you do not
  cover it, and do not guess at the law.
- Keep it short and plain: 2-5 sentences, no legalese, no disclaimers about being an AI.
- End by pointing the reader to NALSA's free legal aid helpline 15100.

Extracts:
{context}

Question: {question}"""

state = {"ready": False, "reason": "not initialised", "chunks": 0, "embeddings": "", "model": ""}
_store = None
_client = None


def _open_store():
    from langchain_chroma import Chroma

    return Chroma(persist_directory=str(PERSIST_DIR), embedding_function=build_embeddings())


def _make_client(provider: str, key: str):
    if provider == "groq":
        from groq import Groq

        return Groq(api_key=key)
    from openai import OpenAI

    return OpenAI(api_key=key)


def startup() -> None:
    """Sets state['reason'] rather than raising, so /health can explain what is wrong."""
    global _store, _client

    try:
        provider, key_var, model = llm_config()
        state["embeddings"] = embedding_id()
    except ValueError as exc:
        state["reason"] = str(exc)
        return
    state["model"] = f"{provider}/{model}"

    if not os.getenv(key_var):
        state["reason"] = f"LLM_PROVIDER={provider} needs {key_var}"
        return

    if not MANIFEST.is_file():
        state["reason"] = "the index is not built - run build_index.py"
        return
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    state["chunks"] = manifest.get("chunks", 0)

    built_with = manifest.get("embedding_model")
    if built_with != state["embeddings"]:
        state["reason"] = (
            f"the index was built with {built_with} but EMBEDDINGS is set to"
            f" {state['embeddings']} - rebuild the index"
        )
        return

    try:
        _store = _open_store()
        _client = _make_client(provider, os.getenv(key_var))
    except Exception as exc:
        state["reason"] = f"cannot open the index: {exc}"
        return

    state["ready"] = True
    state["reason"] = "ok"


def retrieve(question: str) -> list:
    return _store.similarity_search(question, k=TOP_K)


def complete(question: str, docs: list) -> str:
    _, _, model = llm_config()
    context = "\n\n".join(f"[{d.metadata.get('act', '?')}] {d.page_content}" for d in docs)
    reply = _client.chat.completions.create(
        model=model,
        temperature=0.2,
        messages=[{"role": "user", "content": PROMPT.format(context=context or "none", question=question)}],
    )
    return (reply.choices[0].message.content or "").strip()


def ask_question(question: str) -> dict:
    docs = retrieve(question)
    seen, sources = set(), []
    for doc in docs:
        act = doc.metadata.get("act", "")
        if act and act not in seen:
            seen.add(act)
            sources.append({"title": act, "source": doc.metadata.get("source", "")})
    return {"answer": complete(question, docs).strip(), "sources": sources}


startup()
