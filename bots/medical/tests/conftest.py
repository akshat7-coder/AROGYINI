import os

# Blank the keys before app.py is imported: load_dotenv() leaves set vars alone, so this
# keeps _startup() from touching Pinecone or downloading the embedding model.
os.environ.setdefault("PINECONE_API_KEY", "")
os.environ["PINECONE_API_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""
os.environ["GEMINI_API_KEY"] = ""
# Blank these too, or a developer's own .env changes what the tests assert.
os.environ["LLM_MODEL"] = ""
os.environ["TOP_K"] = "3"

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


@pytest.fixture(autouse=True)
def restore_state():
    """_startup() mutates module-level state, so put it back after every test."""
    before = dict(app_module.state)
    yield
    app_module.state.clear()
    app_module.state.update(before)


@pytest.fixture
def app_mod():
    return app_module
