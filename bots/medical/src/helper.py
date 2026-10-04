from typing import List

from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

# 500/20 sliced sentences mid-word, so retrieved passages started mid-thought.
# Changing these means re-running store_index.py --rebuild.
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def load_pdf_file(data: str) -> List[Document]:
    return DirectoryLoader(data, glob="*.pdf", loader_cls=PyPDFLoader).load()


def filter_to_minimal_docs(docs: List[Document]) -> List[Document]:
    """Drop every metadata key except source and page, which are all the API returns."""
    return [
        Document(
            page_content=doc.page_content,
            metadata={
                "source": doc.metadata.get("source", ""),
                "page": doc.metadata.get("page", 0),
            },
        )
        for doc in docs
    ]


def text_split(docs: List[Document]) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    return splitter.split_documents(docs)


def download_hugging_face_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
