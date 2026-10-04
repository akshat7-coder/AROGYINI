"""Paths and provider choices shared by build_index.py and rag_pipeline.py."""
import os
from pathlib import Path

ROOT = Path(__file__).parent
PERSIST_DIR = ROOT / "embeddings" / "vectors"
MANIFEST = ROOT / "embeddings" / "manifest.json"
PDF_DIR = ROOT / "data" / "pdfs"

DEFAULT_LLM_MODELS = {"openai": "gpt-4o-mini", "groq": "llama-3.1-8b-instant"}


def embedding_config() -> tuple[str, str]:
    provider = os.getenv("EMBEDDINGS", "openai").strip().lower()
    if provider == "huggingface":
        return provider, "sentence-transformers/all-MiniLM-L6-v2"
    if provider == "openai":
        return provider, "text-embedding-3-large"
    raise ValueError(f"EMBEDDINGS must be 'openai' or 'huggingface', not {provider!r}")


def embedding_id() -> str:
    """The string recorded in manifest.json, so a provider swap is caught, not silently wrong."""
    provider, model = embedding_config()
    return f"{provider}:{model}"


def build_embeddings():
    provider, model = embedding_config()
    if provider == "huggingface":
        from langchain_huggingface import HuggingFaceEmbeddings

        return HuggingFaceEmbeddings(model_name=model)

    from langchain_openai import OpenAIEmbeddings

    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError(
            "EMBEDDINGS=openai needs OPENAI_API_KEY. Set EMBEDDINGS=huggingface to embed locally."
        )
    return OpenAIEmbeddings(model=model, api_key=key)


def llm_config() -> tuple[str, str, str]:
    """(provider, name of its key env var, model)."""
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    if provider not in DEFAULT_LLM_MODELS:
        raise ValueError(f"LLM_PROVIDER must be 'openai' or 'groq', not {provider!r}")
    key_var = "OPENAI_API_KEY" if provider == "openai" else "GROQ_API_KEY"
    return provider, key_var, os.getenv("LLM_MODEL", DEFAULT_LLM_MODELS[provider])
