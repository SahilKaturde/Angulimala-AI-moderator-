from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma
import random

# Initialize FastAPI app
app = FastAPI(title="Angulimala AI Moderator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for request
class TextRequest(BaseModel):
    text: str

# -------------------------
# 1. Load hate speech model
# -------------------------
print("Loading hate speech model...")
model_name = "facebook/roberta-hate-speech-dynabench-r4-target"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

hate_speech_detector = pipeline(
    "text-classification",
    model=model,
    tokenizer=tokenizer,
    return_all_scores=True
)

def is_hate_speech(text: str, threshold: float = 0.5) -> bool:
    """Return True if text is hate speech, else False."""
    results = hate_speech_detector(text)[0]
    scores = {r['label']: r['score'] for r in results}
    return scores.get("hate", 0) >= threshold

# -------------------------
# 2. Connect to Chroma DB
# -------------------------
print("Loading Chroma DB...")
CHROMA_DIR = "./chroma_reflective_db"

embedding_fn = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
db = Chroma(persist_directory=CHROMA_DIR, embedding_function=embedding_fn)

# -------------------------
# 3. Helper: get a reflective question
# -------------------------
def get_reflective_question(user_input: str) -> str:
    retriever = db.as_retriever(search_kwargs={"k": 3})
    docs = retriever.get_relevant_documents(user_input)
    if not docs:
        return "Why do you think words can hurt others?"
    # randomly pick one of the top matches
    return random.choice(docs).page_content

# -------------------------
# 4. API endpoint
# -------------------------
@app.post("/api/analyze/")
async def analyze_text(request: TextRequest):
    try:
        if is_hate_speech(request.text):
            question = get_reflective_question(request.text)
            return {
                "response": question,
                "type": "reflective",
                "is_hate_speech": True
            }
        else:
            return {
                "response": f"Thanks for sharing! You said: '{request.text}'",
                "type": "normal",
                "is_hate_speech": False
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Angulimala AI Moderator API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)