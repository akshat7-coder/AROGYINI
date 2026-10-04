import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import rag_pipeline

app = FastAPI(title="AROGYINI legal RAG bot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Query(BaseModel):
    question: str = ""


@app.get("/")
def home():
    return {"message": "AROGYINI legal RAG bot. POST /ask with {\"question\": \"...\"}."}


@app.get("/health")
def health():
    state = rag_pipeline.state
    return {
        "status": "ok",
        "ready": state["ready"],
        "reason": state["reason"],
        "chunks": state["chunks"],
        "embedding_model": state["embeddings"],
        "model": state["model"],
    }


@app.post("/ask")
def ask(data: Query):
    question = (data.question or "").strip()
    if not question:
        return JSONResponse({"error": "question is required"}, status_code=400)
    if not rag_pipeline.state["ready"]:
        return JSONResponse({"error": rag_pipeline.state["reason"]}, status_code=503)

    try:
        result = rag_pipeline.ask_question(question)
    except Exception as exc:
        return JSONResponse({"error": f"the legal assistant is unavailable: {exc}"}, status_code=503)
    if not result["answer"]:
        return JSONResponse({"error": "the legal assistant returned an empty answer"}, status_code=503)
    return result


@app.exception_handler(500)
def _json_500(request, exc):
    return JSONResponse({"error": "internal error"}, status_code=500)


if __name__ == "__main__":
    state = rag_pipeline.state
    print(f"Legal bot: ready={state['ready']} ({state['reason']}), {state['chunks']} chunks indexed")
    print(f"  embeddings {state['embeddings']}, LLM {state['model']}")
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8002")))
