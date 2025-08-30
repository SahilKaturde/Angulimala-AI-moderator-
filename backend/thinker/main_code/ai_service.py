import random
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma

# -------------------------
# Load hate speech model
# -------------------------
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
    results = hate_speech_detector(text)[0]
    scores = {r['label']: r['score'] for r in results}
    return scores.get("hate", 0) >= threshold

# -------------------------
# Connect to Chroma DB
# -------------------------
CHROMA_DIR = "./chroma_reflective_db"
embedding_fn = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
db = Chroma(persist_directory=CHROMA_DIR, embedding_function=embedding_fn)

def get_reflective_question(user_input: str) -> str:
    retriever = db.as_retriever(search_kwargs={"k": 3})
    docs = retriever.get_relevant_documents(user_input)
    if not docs:
        return "Why do you think words can hurt others?"
    return random.choice(docs).page_content

# -------------------------
# Main analysis function
# -------------------------
def analyze_text(text: str) -> dict:
    if is_hate_speech(text):
        return {"response": get_reflective_question(text), "type": "reflective"}
    else:
        return {"response": f"Thanks for sharing! You said: '{text}'", "type": "normal"}
