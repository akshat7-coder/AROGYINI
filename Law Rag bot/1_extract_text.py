import os
from PyPDF2 import PdfReader
from tqdm import tqdm

pdf_dir = "data/pdfs/"
output_dir = "data/cleaned_texts/"

os.makedirs(output_dir, exist_ok=True)

for file in tqdm(os.listdir(pdf_dir)):
    if file.endswith(".pdf"):
        pdf_path = os.path.join(pdf_dir, file)
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""

        clean_text = " ".join(text.split())
        output_file = os.path.join(output_dir, file.replace(".pdf", ".txt"))

        with open(output_file, "w", encoding="utf-8") as f:
            f.write(clean_text)

print("✅ All PDFs converted to text and saved in:", output_dir)
