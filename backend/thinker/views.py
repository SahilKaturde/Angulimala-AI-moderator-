# views.py
import os
import random
import logging
import requests
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

# ----------------------------
# Load Models (at startup)
# ----------------------------
try:
    # Hate speech model
    model_name = "facebook/roberta-hate-speech-dynabench-r4-target"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)

    hate_speech_detector = pipeline(
        "text-classification",
        model=model,
        tokenizer=tokenizer,
        return_all_scores=True
    )

    # Chroma DB
    CHROMA_DIR = "C:\Angulimala/backend/thinker/chroma_reflective_db"  # Update this path as needed
    embedding_fn = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    db = Chroma(persist_directory=CHROMA_DIR, embedding_function=embedding_fn)

    logger.info("Models loaded successfully")

except Exception as e:
    logger.error(f"Error loading models: {e}")
    hate_speech_detector = None
    db = None


# ----------------------------
# Helper Functions
# ----------------------------
def is_hate_speech(text: str, threshold: float = 0.5) -> bool:
    """Return True if text is hate speech, else False."""
    if not hate_speech_detector:
        return False
    try:
        results = hate_speech_detector(text)[0]  # list of dicts
        # Log results for debugging
        logger.info(f"Hate speech detection results: {results}")

        # Normalize labels (sometimes 'LABEL_0', 'LABEL_1', etc.)
        scores = {r['label'].lower(): r['score'] for r in results}

        # Common cases: 'hate', 'not-hate', 'LABEL_0', 'LABEL_1'
        if "hate" in scores:
            return scores["hate"] >= threshold
        elif "label_1" in scores:  # usually corresponds to "hate"
            return scores["label_1"] >= threshold
        else:
            # Fallback: choose the highest scoring label
            top_label = max(scores, key=scores.get)
            return "hate" in top_label and scores[top_label] >= threshold

    except Exception as e:
        logger.error(f"Error in hate speech detection: {e}")
        return False



def get_reflective_question(user_input: str) -> str:
    """Get a reflective question from Chroma DB."""
    if not db:
        return "Why do you think words can hurt others?"

    try:
        retriever = db.as_retriever(search_kwargs={"k": 3})
        docs = retriever.get_relevant_documents(user_input)
        if not docs:
            return "Why do you think words can hurt others?"
        return random.choice(docs).page_content
    except Exception as e:
        logger.error(f"Error retrieving reflective question: {e}")
        return "Why do you think words can hurt others?"


# ----------------------------
# API Endpoints
# ----------------------------

@api_view(['POST'])
def analyze_text(request):
    """Analyze text for hate speech and return appropriate response."""
    text = request.data.get('text', '')

    if not text:
        return Response(
            {"error": "Text parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        if is_hate_speech(text):
            question = get_reflective_question(text)
            return Response({
                "response": question,
                "type": "reflective",
                "is_hate_speech": True
            })
        else:
            return Response({
                "response": f"Thanks for sharing! You said: '{text}'",
                "type": "normal",
                "is_hate_speech": False
            })
    except Exception as e:
        logger.error(f"Error in text analysis: {e}")
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ----------------------------
# HuggingFace LLM Response with Fallbacks
# ----------------------------
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
HUGGINGFACE_API_KEY = os.environ.get("HUGGINGFACE_API_KEY", "your_api_key_here")

headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

# Fallback responses for when the API fails
FALLBACK_RESPONSES = {
    "yes": [
        "Thank you for your reflection. It takes courage to acknowledge our impact on others.",
        "I appreciate your willingness to reflect on your words. This is an important step toward mindful communication.",
        "Your acknowledgment shows self-awareness. How would you like to continue this conversation?"
    ],
    "no": [
        "I understand this might be difficult to acknowledge. Would you be willing to explore this further?",
        "It can be challenging to see how our words affect others. Let's continue this conversation with compassion.",
        "Thank you for engaging with this process. Would you like to discuss this further in a supportive space?"
    ],
    "general": [
        "I appreciate you continuing this dialogue. Reflection is a powerful tool for personal growth.",
        "Thank you for sharing. Mindful communication helps build understanding between people.",
        "Your engagement in this process shows courage. How else would you like to explore this topic?",
        "This conversation is an opportunity for growth. What would you like to discuss next?",
        "I'm here to support your journey toward more mindful communication. What's on your mind?"
    ]
}

@api_view(['POST'])
def respond_to_reflection(request):
    """
    Take original text + reflective question + user answer,
    send to HuggingFace Mistral model, return motivating response.
    """
    original_text = request.data.get("original_text")
    reflective_question = request.data.get("reflective_question")
    user_answer = request.data.get("user_answer")

    if not all([original_text, reflective_question, user_answer]):
        return Response(
            {"error": "original_text, reflective_question, and user_answer are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Build context for the LLM
    prompt = f"""
    The user originally wrote: "{original_text}"
    Then the AI moderator asked: "{reflective_question}"
    The user replied: "{user_answer}"

    Now, as a peace-driven AI moderator, respond with empathy,
    motivate humanity, and encourage global peace.
    Keep your reply reflective, thoughtful, and compassionate.
    """

    try:
        response = requests.post(
            HUGGINGFACE_API_URL,
            headers=headers,
            json={"inputs": prompt, "parameters": {"max_new_tokens": 250}},
            timeout=30  # Add timeout to prevent hanging
        )
        
        # Check for API key errors
        if response.status_code == 401:
            logger.error("Invalid HuggingFace API credentials")
            # Use fallback response instead of failing
            if "yes" in user_answer.lower():
                fallback = random.choice(FALLBACK_RESPONSES["yes"])
            elif "no" in user_answer.lower():
                fallback = random.choice(FALLBACK_RESPONSES["no"])
            else:
                fallback = random.choice(FALLBACK_RESPONSES["general"])
                
            return Response({
                "response": fallback,
                "type": "peaceful_response"
            })
            
        response.raise_for_status()  # Raise exception for other HTTP errors
        
        result = response.json()

        if isinstance(result, list) and len(result) > 0 and "generated_text" in result[0]:
            ai_text = result[0]["generated_text"]
        elif isinstance(result, dict) and "generated_text" in result:
            ai_text = result["generated_text"]
        else:
            ai_text = str(result)

        # Clean up the response to remove the prompt if it's included
        if prompt in ai_text:
            ai_text = ai_text.replace(prompt, "").strip()

        return Response({
            "response": ai_text.strip(),
            "type": "peaceful_response"
        })

    except Exception as e:
        logger.error(f"Error in HuggingFace call: {e}")
        # Use appropriate fallback based on user answer
        if "yes" in user_answer.lower():
            fallback = random.choice(FALLBACK_RESPONSES["yes"])
        elif "no" in user_answer.lower():
            fallback = random.choice(FALLBACK_RESPONSES["no"])
        else:
            fallback = random.choice(FALLBACK_RESPONSES["general"])
            
        return Response({
            "response": fallback,
            "type": "peaceful_response"
        })


@api_view(['GET'])
def health_check(request):
    """Health check endpoint."""
    return Response({
        "status": "ok",
        "models_loaded": hate_speech_detector is not None and db is not None,
        "huggingface_configured": bool(HUGGINGFACE_API_KEY and HUGGINGFACE_API_KEY != "your_api_key_here")
    })