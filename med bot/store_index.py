from src.helper import load_pdf_file, text_split, download_hugging_face_embeddings
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Set API keys
os.environ["PINECONE_API_KEY"] = os.getenv(
    "PINECONE_API_KEY",
    "pcsk_3NsC4G_32anrTFjdL9j8bL8aBtY2BqHC4SKxz8VpB3qxZmAQFyFUzinuEXvumAKyUoF4wU"
)
os.environ["GOOGLE_API_KEY"] = os.getenv(
    "GOOGLE_API_KEY",
    "AIzaSyDmsvsNHvBTICgEZ5O8elaxZtAHKhv210U"
)

print("📂 Loading PDF documents...")
extracted_data = load_pdf_file(data='data/')  # Your PDF folder

print("✂️ Splitting text into chunks...")
text_chunks = text_split(extracted_data)
print(f"✅ Created {len(text_chunks)} text chunks")

print("🔢 Downloading embeddings model...")
embeddings = download_hugging_face_embeddings()

print("📤 Uploading to Pinecone...")
index_name = "medical-chatbot"

# Create or update Pinecone index
docsearch = PineconeVectorStore.from_documents(
    documents=text_chunks,
    embedding=embeddings,
    index_name=index_name
)

print("✅ Successfully uploaded documents to Pinecone!")
print(f"📊 Total chunks indexed: {len(text_chunks)}")