# build_reflective_chroma.py
import os
import json
from pathlib import Path
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma

# ---- CONFIG ----
# Path to your JSON file (adjust if needed)
JSON_PATH = r"C:\Users\Shree\OneDrive\Desktop\Angulimala AI\thinker\reflective_questions.json"
# Where to persist Chroma
CHROMA_DIR = r"C:\Users\Shree\OneDrive\Desktop\Angulimala AI\thinker\chroma_reflective_db"

def load_questions(json_path: str):
    """
    Accepts JSON in either of these shapes:
    1) [{"id": 1, "question": "..."}, ...]
    2) ["question 1", "question 2", ...]
    3) [{"text": "..."}, ...]
    Returns a list[str] of questions.
    """
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, str):
                texts.append(item.strip())
            elif isinstance(item, dict):
                q = item.get("question") or item.get("text") or item.get("q")
                if q:
                    texts.append(str(q).strip())
    else:
        raise ValueError("JSON root should be a list of strings or objects.")

    texts = [t for t in texts if t]
    if not texts:
        raise ValueError("No questions found in JSON. Check keys like 'question' or 'text'.")
    return texts

def main():
    Path(CHROMA_DIR).mkdir(parents=True, exist_ok=True)
    texts = load_questions(JSON_PATH)

    # Small, fast CPU-friendly embedding model
    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

    # Build & persist the DB
    vectordb = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        persist_directory=CHROMA_DIR
    )
    vectordb.persist()
    print(f"✅ Created Chroma DB with {len(texts)} entries at: {CHROMA_DIR}")

if __name__ == "__main__":
    main()
