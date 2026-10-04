import os

# Blank the keys before app.py is imported: load_dotenv() leaves set vars alone, so this
# keeps _startup() from touching Pinecone or downloading the embedding model.
os.environ.setdefault("PINECONE_API_KEY", "")
os.environ["PINECONE_API_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""

import pytest

import app as app_module


@pytest.fixture
def client():
    app_module.app.config["TESTING"] = True
    return app_module.app.test_client()


@pytest.fixture
def ready(monkeypatch):
    """A bot with a built index and a working LLM, with no network calls."""
    monkeypatch.setitem(app_module.state, "ready", True)
    monkeypatch.setitem(app_module.state, "reason", "ok")
    monkeypatch.setitem(app_module.state, "vectors", 42)
    monkeypatch.setattr(
        app_module,
        "retrieve",
        lambda q: [{"text": "Iron deficiency is common.", "source": "Medical_book.pdf", "page": 7}],
    )
    monkeypatch.setattr(app_module, "complete", lambda q, docs: "Eat iron-rich food. See a doctor.")
    return app_module
