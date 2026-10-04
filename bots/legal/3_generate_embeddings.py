import os, json
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

# Load your OpenAI API key
load_dotenv()

# Initialize embedding model (use high-quality one)
embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")

# Folder paths
chunks_dir = "data/chunks/"
persist_dir = "embeddings/vectors/"
os.makedirs(persist_dir, exist_ok=True)

documents = []

# Read each chunk JSON file
for file in os.listdir(chunks_dir):
    if file.endswith(".json"):
        with open(os.path.join(chunks_dir, file), "r", encoding="utf-8") as f:
            data = json.load(f)
            for item in data:
                documents.append(item)

# Separate text and metadata
texts = [doc["content"] for doc in documents]
metadatas = [{"source": doc["source"]} for doc in documents]

print(f"🔹 Total text chunks to embed: {len(texts)}")

# Create local Chroma vector store
db = Chroma.from_texts(
    texts=texts,
    embedding=embedding_model,
    metadatas=metadatas,
    persist_directory=persist_dir
)

# Save database
db.persist()
print("✅ Embeddings generated and stored locally in:", persist_dir)
