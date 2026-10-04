import json

import pytest

import rag_pipeline


def test_health_reports_not_ready_without_keys(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["ready"] is False
    assert "OPENAI_API_KEY" in body["reason"]


def test_health_reports_ready(client, ready):
    body = client.get("/health").json()
    assert body["ready"] is True
    assert body["chunks"] == 1234
    assert body["embedding_model"] == "openai:text-embedding-3-large"


def test_ask_happy_path(client, ready):
    res = client.post("/ask", json={"question": "What is sexual harassment at work?"})
    assert res.status_code == 200
    body = res.json()
    assert "POSH Act, 2013" in body["answer"]
    assert body["sources"] == [{"title": "POSH Act, 2013", "source": "posh.txt"}]


@pytest.mark.parametrize("payload", [{}, {"question": ""}, {"question": "   "}])
def test_ask_rejects_missing_question(client, ready, payload):
    res = client.post("/ask", json=payload)
    assert res.status_code == 400
    assert res.json() == {"error": "question is required"}


def test_ask_503_when_index_not_built(client):
    res = client.post("/ask", json={"question": "What is dowry?"})
    assert res.status_code == 503
    assert "OPENAI_API_KEY" in res.json()["error"]


def test_ask_503_when_llm_fails(client, ready, monkeypatch):
    def boom(question, docs):
        raise RuntimeError("openai rate limited")

    monkeypatch.setattr(ready, "complete", boom)
    res = client.post("/ask", json={"question": "What is dowry?"})
    assert res.status_code == 503
    assert "openai rate limited" in res.json()["error"]


def test_ask_503_when_answer_is_empty(client, ready, monkeypatch):
    monkeypatch.setattr(ready, "complete", lambda q, docs: "   ")
    res = client.post("/ask", json={"question": "What is dowry?"})
    assert res.status_code == 503


def test_startup_rejects_an_index_built_with_other_embeddings(client, monkeypatch, tmp_path):
    manifest = tmp_path / "manifest.json"
    manifest.write_text(
        json.dumps({"embedding_model": "huggingface:sentence-transformers/all-MiniLM-L6-v2", "chunks": 9}),
        encoding="utf-8",
    )
    monkeypatch.setattr(rag_pipeline, "MANIFEST", manifest)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("EMBEDDINGS", "openai")

    rag_pipeline.startup()

    assert rag_pipeline.state["ready"] is False
    assert "rebuild the index" in rag_pipeline.state["reason"]
    assert client.post("/ask", json={"question": "x"}).status_code == 503


def test_startup_reports_a_missing_index(monkeypatch, tmp_path):
    monkeypatch.setattr(rag_pipeline, "MANIFEST", tmp_path / "absent.json")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")

    rag_pipeline.startup()

    assert rag_pipeline.state["ready"] is False
    assert "build_index.py" in rag_pipeline.state["reason"]


def test_startup_rejects_an_unknown_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    rag_pipeline.startup()
    assert rag_pipeline.state["ready"] is False
    assert "LLM_PROVIDER" in rag_pipeline.state["reason"]
