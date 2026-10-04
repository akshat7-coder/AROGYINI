import os

# Blank the keys before rag_pipeline is imported: load_dotenv() leaves set vars alone, so
# startup() stops at the key check and never opens Chroma or calls a provider.
os.environ["OPENAI_API_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""
# Pin the provider config too: the repo .env may select groq, which would change what
# these tests assert about the openai defaults.
os.environ["LLM_PROVIDER"] = "openai"
os.environ["EMBEDDINGS"] = "openai"
os.environ["LLM_MODEL"] = ""

import pytest
from fastapi.testclient import TestClient

import rag_pipeline
import server


@pytest.fixture
def client():
    return TestClient(server.app)


@pytest.fixture(autouse=True)
def restore_state():
    """startup() mutates a module-level dict, so put it back after every test."""
    before = dict(rag_pipeline.state)
    yield
    rag_pipeline.state.clear()
    rag_pipeline.state.update(before)


class FakeDoc:
    def __init__(self, content, act, source):
        self.page_content = content
        self.metadata = {"act": act, "source": source}


@pytest.fixture
def ready(monkeypatch):
    """An index that is built and an LLM that answers, with no network calls."""
    rag_pipeline.state.update(
        ready=True, reason="ok", chunks=1234, embeddings="openai:text-embedding-3-large",
        model="openai/gpt-4o-mini",
    )
    monkeypatch.setattr(
        rag_pipeline,
        "retrieve",
        lambda q: [
            FakeDoc("Section 3 defines sexual harassment.", "POSH Act, 2013", "posh.txt"),
            FakeDoc("An internal committee shall be formed.", "POSH Act, 2013", "posh.txt"),
        ],
    )
    monkeypatch.setattr(
        rag_pipeline,
        "complete",
        lambda q, docs: "Section 3 of the POSH Act, 2013 covers this. Call NALSA on 15100.",
    )
    return rag_pipeline
