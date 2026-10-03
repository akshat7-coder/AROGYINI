from flask import Flask, render_template, request, jsonify
from src.helper import download_hugging_face_embeddings
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from dotenv import load_dotenv
import os
import traceback

# ------------------ Flask Setup ------------------ #
app = Flask(__name__)

# ------------------ Load Environment Variables ------------------ #
load_dotenv()

os.environ["PINECONE_API_KEY"] = os.getenv(
    "PINECONE_API_KEY",
    "pcsk_3NsC4G_32anrTFjdL9j8bL8aBtY2BqHC4SKxz8VpB3qxZmAQFyFUzinuEXvumAKyUoF4wU"
)
os.environ["GOOGLE_API_KEY"] = os.getenv(
    "GOOGLE_API_KEY",
    "AIzaSyDmsvsNHvBTICgEZ5O8elaxZtAHKhv210U"
)

# ------------------ Embeddings & Pinecone ------------------ #
print("🔄 Initializing embeddings...")
embeddings = download_hugging_face_embeddings()
index_name = "medical-chatbot"

print("🔌 Connecting to Pinecone...")
try:
    docsearch = PineconeVectorStore.from_existing_index(
        index_name=index_name,
        embedding=embeddings
    )
    print("✅ Connected to Pinecone successfully!")
except Exception as e:
    print(f"❌ Pinecone connection error: {e}")
    print("⚠️ Make sure you've run store_index.py first to upload documents!")

# Retriever with more results
retriever = docsearch.as_retriever(
    search_type="similarity", 
    search_kwargs={"k": 5}  # Get top 5 most relevant chunks
)

# ------------------ Gemini Model ------------------ #
chatModel = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    google_api_key=os.environ["GOOGLE_API_KEY"],
    temperature=0.3
)

# ------------------ Improved Prompt Template ------------------ #
prompt = ChatPromptTemplate.from_template("""
You are a knowledgeable medical assistant. Your goal is to provide helpful, accurate medical information based on the context provided.

IMPORTANT INSTRUCTIONS:
- Use the context below to answer the question
- If the context contains relevant information, provide a detailed, helpful answer
- If the context doesn't contain enough information, say: "I don't have specific information about that in my knowledge base. Please consult a healthcare professional."
- Always be clear, professional, and helpful
- Include relevant details from the context when available

Context from medical documents:
{context}

User Question: {input}

Your Answer:
""")

# ------------------ Combine Docs Function ------------------ #
def combine_docs(docs):
    """Extract and combine text from retrieved documents."""
    if not docs:
        print("⚠️ No documents retrieved from Pinecone!")
        return "No relevant information found in the database."
    
    print(f"📄 Retrieved {len(docs)} documents from Pinecone")
    
    try:
        text_parts = []
        for i, doc in enumerate(docs):
            if hasattr(doc, "page_content"):
                content = str(doc.page_content).strip()
                if content:
                    text_parts.append(content)
                    print(f"  Doc {i+1}: {content[:100]}...")  # Debug: show first 100 chars
            elif isinstance(doc, dict):
                if "page_content" in doc:
                    text_parts.append(str(doc["page_content"]))
                elif "text" in doc:
                    text_parts.append(str(doc["text"]))
                elif "content" in doc:
                    text_parts.append(str(doc["content"]))
        
        result = "\n\n".join(text_parts)
        print(f"✅ Combined {len(text_parts)} text parts")
        return result if result else "No content extracted from documents."
    
    except Exception as e:
        print(f"❌ Error in combine_docs: {e}")
        traceback.print_exc()
        return "Error processing documents."

# ------------------ Build RAG Chain ------------------ #
rag_chain = (
    {
        "context": retriever | RunnableLambda(combine_docs),
        "input": RunnablePassthrough(),
    }
    | prompt
    | chatModel
)

# ------------------ Flask Routes ------------------ #
@app.route("/")
def index():
    return render_template("chat.html")

@app.route("/get", methods=["POST"])
def chat():
    msg = request.form.get("msg", "").strip()
    
    if not msg:
        return "Please enter a question."
    
    print(f"\n{'='*60}")
    print(f"🧠 USER QUERY: {msg}")
    print(f"{'='*60}")

    try:
        # Invoke the RAG chain
        response = rag_chain.invoke(msg)
        
        print(f"\n✅ Response Type: {type(response)}")
        
        # Extract answer from response
        if hasattr(response, "content"):
            answer = response.content
        elif isinstance(response, dict):
            answer = (
                response.get("answer")
                or response.get("output")
                or response.get("content")
                or str(response)
            )
        else:
            answer = str(response)
        
        print(f"\n🤖 GEMINI ANSWER:\n{answer}")
        print(f"{'='*60}\n")
        
        return answer

    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(f"\n❌ ERROR: {error_msg}")
        print("\n📋 FULL TRACEBACK:")
        traceback.print_exc()
        print(f"{'='*60}\n")
        return f"Sorry, I encountered an error: {error_msg}"

# ------------------ Health Check Route ------------------ #
@app.route("/health", methods=["GET"])
def health():
    """Check if the system is working"""
    try:
        # Test retriever
        test_docs = retriever.get_relevant_documents("test")
        return jsonify({
            "status": "healthy",
            "pinecone_connected": True,
            "documents_in_index": len(test_docs) > 0
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

# ------------------ Run Flask App ------------------ #
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🏥 MEDICAL CHATBOT STARTING")
    print("="*60)
    print(f"📍 Server: http://localhost:8080")
    print(f"📊 Health Check: http://localhost:8080/health")
    print("="*60 + "\n")
    
    app.run(host="0.0.0.0", port=8080, debug=False)