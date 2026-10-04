import pytest


def test_health_reports_not_ready_without_keys(client):
    body = client.get("/health").get_json()
    assert body["status"] == "ok"
    assert body["ready"] is False
    assert "PINECONE_API_KEY" in body["reason"]


def test_health_reports_ready(client, ready):
    body = client.get("/health").get_json()
    assert body["ready"] is True
    assert body["vectors"] == 42


def test_ask_happy_path(client, ready):
    res = client.post("/ask", json={"question": "What causes anaemia?"})
    assert res.status_code == 200
    body = res.get_json()
    assert body["answer"] == "Eat iron-rich food. See a doctor."
    assert body["sources"] == [{"title": "Medical book", "source": "Medical_book.pdf"}]


@pytest.mark.parametrize("payload", [{}, {"question": ""}, {"question": "   "}])
def test_ask_rejects_missing_question(client, ready, payload):
    res = client.post("/ask", json=payload)
    assert res.status_code == 400
    assert res.get_json() == {"error": "question is required"}


def test_ask_503_when_index_not_built(client):
    res = client.post("/ask", json={"question": "What causes anaemia?"})
    assert res.status_code == 503
    assert "PINECONE_API_KEY" in res.get_json()["error"]


def test_ask_503_when_llm_fails(client, ready, monkeypatch):
    def boom(question, docs):
        raise RuntimeError("groq timed out")

    monkeypatch.setattr(ready, "complete", boom)
    res = client.post("/ask", json={"question": "What causes anaemia?"})
    assert res.status_code == 503
    assert "groq timed out" in res.get_json()["error"]


def test_ask_503_when_answer_is_empty(client, ready, monkeypatch):
    monkeypatch.setattr(ready, "complete", lambda q, docs: "  ")
    res = client.post("/ask", json={"question": "What causes anaemia?"})
    assert res.status_code == 503


def test_errors_are_json_never_html(client):
    res = client.get("/no-such-route")
    assert res.status_code == 404
    assert res.is_json and "error" in res.get_json()


def test_legacy_ui_route_returns_text(client, ready):
    res = client.post("/get", data={"msg": "What causes anaemia?"})
    assert res.status_code == 200
    assert res.get_data(as_text=True) == "Eat iron-rich food. See a doctor."


def test_default_provider_is_gemini(monkeypatch, app_mod):
    monkeypatch.setenv("PINECONE_API_KEY", "pc-test")
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setattr(app_mod, "LLM_PROVIDER", "gemini")

    app_mod._startup()

    assert app_mod.state["ready"] is False
    assert app_mod.state["reason"] == "LLM_PROVIDER=gemini needs GEMINI_API_KEY"
    assert app_mod.state["model"] == "gemini/gemini-2.5-flash"


def test_groq_provider_asks_for_its_own_key(monkeypatch, app_mod):
    monkeypatch.setenv("PINECONE_API_KEY", "pc-test")
    monkeypatch.setenv("GROQ_API_KEY", "")
    monkeypatch.setattr(app_mod, "LLM_PROVIDER", "groq")

    app_mod._startup()

    assert app_mod.state["reason"] == "LLM_PROVIDER=groq needs GROQ_API_KEY"
    assert app_mod.state["model"] == "groq/openai/gpt-oss-120b"


def test_llm_model_overrides_the_provider_default(monkeypatch, app_mod):
    monkeypatch.setenv("PINECONE_API_KEY", "pc-test")
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("LLM_MODEL", "gemini-3.8-flash")
    monkeypatch.setattr(app_mod, "LLM_PROVIDER", "gemini")

    app_mod._startup()

    assert app_mod.state["model"] == "gemini/gemini-3.8-flash"


def test_unknown_provider_is_rejected(monkeypatch, app_mod):
    monkeypatch.setattr(app_mod, "LLM_PROVIDER", "openai")

    app_mod._startup()

    assert app_mod.state["ready"] is False
    assert "LLM_PROVIDER must be one of" in app_mod.state["reason"]


def test_pinecone_key_is_still_checked_first(monkeypatch, app_mod):
    monkeypatch.setenv("PINECONE_API_KEY", "")
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setattr(app_mod, "LLM_PROVIDER", "gemini")

    app_mod._startup()

    assert app_mod.state["reason"] == "PINECONE_API_KEY is not set"
