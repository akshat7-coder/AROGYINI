"""Build the Chroma index from the .txt Acts in this folder plus any PDFs in data/pdfs.

Replaces the old 1_extract_text / 2_chunk_text / 3_generate_embeddings scripts.
"""
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

from acts import act_name
from config import MANIFEST, PDF_DIR, PERSIST_DIR, ROOT, build_embeddings, embedding_id


def read_pdf(path: Path) -> str:
    from pypdf import PdfReader

    return " ".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)


def collect() -> list[tuple[Path, str]]:
    """Every source document as (path, text), skipping empty files with a warning."""
    paths = sorted(p for p in ROOT.glob("*.txt") if p.name != "requirements.txt")
    paths += sorted(PDF_DIR.glob("*.pdf")) if PDF_DIR.is_dir() else []

    out = []
    for path in paths:
        text = read_pdf(path) if path.suffix == ".pdf" else path.read_text(encoding="utf-8", errors="replace")
        text = " ".join(text.split())
        if not text:
            print(f"  WARNING: {path.name} has no extractable text - skipped")
            continue
        out.append((path, text))
    return out


def main() -> int:
    load_dotenv()
    print(f"Embedding model: {embedding_id()}")

    print("Reading sources...")
    docs = collect()
    if not docs:
        print(f"No usable .txt or PDF sources found in {ROOT}. Nothing to index.")
        return 1

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts, metadatas = [], []
    for path, text in docs:
        chunks = splitter.split_text(text)
        print(f"  {path.name}: {len(chunks)} chunks")
        texts += chunks
        metadatas += [{"source": path.name, "act": act_name(path.stem)}] * len(chunks)

    if PERSIST_DIR.exists():
        print(f"Removing the previous index at {PERSIST_DIR}...")
        shutil.rmtree(PERSIST_DIR)
    PERSIST_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Embedding {len(texts)} chunks (this is the slow part)...")
    Chroma.from_texts(
        texts=texts,
        embedding=build_embeddings(),
        metadatas=metadatas,
        persist_directory=str(PERSIST_DIR),
    )

    MANIFEST.write_text(
        json.dumps(
            {
                "embedding_model": embedding_id(),
                "chunks": len(texts),
                "sources": sorted({m["source"] for m in metadatas}),
                "built_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Done. {len(texts)} chunks from {len(docs)} sources -> {PERSIST_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
