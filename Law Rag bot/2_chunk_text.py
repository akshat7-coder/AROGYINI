import os, json
from langchain_text_splitters import RecursiveCharacterTextSplitter

input_dir = "data/cleaned_texts/"
output_dir = "data/chunks/"
os.makedirs(output_dir, exist_ok=True)

# Split text into 1000-character chunks with small overlap for context
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

for file in os.listdir(input_dir):
    if file.endswith(".txt"):
        with open(os.path.join(input_dir, file), "r", encoding="utf-8") as f:
            text = f.read()

        chunks = splitter.split_text(text)
        data = [{"source": file, "content": chunk} for chunk in chunks]

        with open(os.path.join(output_dir, file.replace(".txt", ".json")), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ Text split into chunks and saved in:", output_dir)
