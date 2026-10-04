from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

from openai import OpenAI
from dotenv import load_dotenv
import os

# --- Load environment variables ---
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("❌ OPENAI_API_KEY not found. Please add it to your .env file.")

# --- Initialize components ---
embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-large",
    openai_api_key=api_key
)

db = Chroma(
    persist_directory="embeddings/vectors/",
    embedding_function=embedding_model
)

client = OpenAI(api_key=api_key)

def ask_question(query):
    """Retrieve relevant context and generate a law-based answer"""

    results = db.similarity_search(query, k=3)
    context = "\n\n".join([r.page_content for r in results])

    prompt = f"""
You are a legal assistant specializing in Indian women's laws.
Use the context below (from verified Indian Acts) to answer the question factually and clearly.
If the answer is not found in the provided context, say:
"I don’t have enough information from the available acts to answer this."

Context:
{context}

Question: {query}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    answer = response.choices[0].message.content
    print("\n🤖 Answer:\n", answer)
    print("\n---------------------------------------------\n")


if __name__ == "__main__":
    print("💬 Ask your Women's Law Bot (type 'exit' to quit)")
    while True:
        query = input("\n👩‍⚖️ Question: ")
        if query.lower() in ["exit", "quit"]:
            print("👋 Goodbye! Stay informed and empowered.")
            break
        ask_question(query)
