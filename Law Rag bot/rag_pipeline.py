
import os
import json
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from tqdm import tqdm

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from openai import OpenAI

# Load key
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-large",
    openai_api_key=api_key
)

def extract_text():
    pdf_folder = "data/pdfs"
    output_folder = "data/cleaned_texts"
    os.makedirs(output_folder, exist_ok=True)

    for file in os.listdir(pdf_folder):
        if file.endswith(".pdf"):
            pdf_path = os.path.join(pdf_folder, file)
            reader = PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            clean_text = " ".join(text.split())
            out_file = os.path.join(output_folder, file.replace(".pdf", ".txt"))
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(clean_text)

def chunk_text():
    input_folder = "data/cleaned_texts"
    output_folder = "data/chunks"
    os.makedirs(output_folder, exist_ok=True)

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    for file in os.listdir(input_folder):
        if file.endswith(".txt"):
            with open(os.path.join(input_folder, file), "r", encoding="utf-8") as f:
                text = f.read()
            chunks = splitter.split_text(text)
            data = [{"source": file, "content": chunk} for chunk in chunks]
            with open(os.path.join(output_folder, file.replace(".txt", ".json")), "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

def create_embeddings():
    folder = "data/chunks"
    persist_dir = "embeddings/vectors"
    os.makedirs(persist_dir, exist_ok=True)

    documents = []
    for file in os.listdir(folder):
        if file.endswith(".json"):
            with open(os.path.join(folder, file), "r", encoding="utf-8") as f:
                docs = json.load(f)
                documents.extend(docs)

    texts = [doc["content"] for doc in documents]
    metadata = [{"source": doc["source"]} for doc in documents]

    db = Chroma.from_texts(
        texts=texts,
        embedding=embedding_model,
        metadatas=metadata,
        persist_directory=persist_dir
    )

def ask_question(query):
    db = Chroma(
        persist_directory="embeddings/vectors",
        embedding_function=embedding_model
    )

    results = db.similarity_search(query, k=3)
    context = "\n\n".join([r.page_content for r in results])

    prompt = f"""
    You are a legal assistant specializing in Indian women's rights.
    Use ONLY the following context to answer.

    Context:
    {context}

    Question:
    {query}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )

    return response.choices[0].message.content
