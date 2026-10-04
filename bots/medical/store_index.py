"""Build the Pinecone index from the PDFs in data/. Run with --rebuild to replace it."""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec

from src.helper import (
    EMBEDDING_DIM,
    download_hugging_face_embeddings,
    filter_to_minimal_docs,
    load_pdf_file,
    text_split,
)

DATA_DIR = Path(__file__).parent / "data"
BATCH = 100


def main(rebuild: bool) -> int:
    load_dotenv()
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("PINECONE_API_KEY is not set. Copy .env.example to .env and fill it in.")
        return 1

    index_name = os.getenv("PINECONE_INDEX_NAME", "medical-chatbot")
    pdfs = sorted(DATA_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {DATA_DIR}. Put at least one reference PDF there first.")
        return 1
    print(f"Found {len(pdfs)} PDF(s): {', '.join(p.name for p in pdfs)}")

    pc = Pinecone(api_key=api_key)
    if not pc.has_index(index_name):
        print(f"Creating index {index_name} ({EMBEDDING_DIM} dims, cosine)...")
        pc.create_index(
            name=index_name,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
    index = pc.Index(index_name)

    existing = index.describe_index_stats().get("total_vector_count", 0)
    if existing and not rebuild:
        print(f"Index {index_name} already holds {existing} vectors. Nothing to do.")
        print("Run 'python store_index.py --rebuild' to re-upload from scratch.")
        return 0
    if existing and rebuild:
        print(f"Deleting {existing} existing vectors...")
        index.delete(delete_all=True)

    chunks = text_split(filter_to_minimal_docs(load_pdf_file(str(DATA_DIR))))
    print(f"Split into {len(chunks)} chunks. Loading the embedding model...")
    embeddings = download_hugging_face_embeddings()

    print("Embedding and upserting...")
    for start in range(0, len(chunks), BATCH):
        batch = chunks[start : start + BATCH]
        vectors = embeddings.embed_documents([c.page_content for c in batch])
        index.upsert(
            vectors=[
                {
                    "id": f"chunk-{start + i}",
                    "values": vector,
                    "metadata": {
                        "text": chunk.page_content,
                        "source": Path(chunk.metadata.get("source", "")).name,
                        "page": int(chunk.metadata.get("page", 0)),
                    },
                }
                for i, (chunk, vector) in enumerate(zip(batch, vectors))
            ]
        )
        print(f"  {min(start + BATCH, len(chunks))}/{len(chunks)}")

    print(f"Done. {len(chunks)} chunks indexed in {index_name}.")
    return 0


if __name__ == "__main__":
    sys.exit(main(rebuild="--rebuild" in sys.argv))
