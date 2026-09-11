import os
import sys
import json
import numpy as np
import joblib


def load_intent_model():
    base_dir = os.path.dirname(__file__)
    models_dir = os.path.join(base_dir, "models")

    clf_path = os.path.join(models_dir, "intent_classifier.joblib")
    vec_path = os.path.join(models_dir, "intent_vectorizer.joblib")

    if not os.path.exists(clf_path) or not os.path.exists(vec_path):
        raise FileNotFoundError("Intent model artifacts missing. Run train_intent_model.py first.")

    clf = joblib.load(clf_path)
    vectorizer = joblib.load(vec_path)
    return clf, vectorizer

try:
    INTENT_CLF, INTENT_VEC = load_intent_model()
except Exception:
    INTENT_CLF, INTENT_VEC = None, None


def predict_intent(text):
    if not INTENT_CLF or not INTENT_VEC:
        return {"intent": "OUT_OF_SCOPE", "confidence": 0.0, "error": "Model not loaded"}

    cleaned = text.lower().strip()
    if not cleaned:
        return {"intent": "NEEDS_CLARIFICATION", "confidence": 0.5}

    if cleaned in ["hi", "hello", "hey", "hii", "hiii", "hello there", "hey there", "good morning", "good afternoon", "good evening", "namaste", "namaskar"]:
        return {"intent": "GREETING", "confidence": 0.99}
    if cleaned in ["how are you", "hello how are you", "i am fine", "i'm fine", "i am good", "i'm good", "what's up", "how is it going", "sab badhiya", "all good", "kaise ho", "aap kaise ho"]:
        return {"intent": "CASUAL_CONVERSATION", "confidence": 0.99}
    if cleaned in ["thanks", "thank you", "thankyou", "thanks a lot", "thank you so much", "dhanyawad", "shukriya"]:
        return {"intent": "THANKS", "confidence": 0.99}
    if cleaned in ["yes", "yeah", "yep", "correct", "confirm", "proceed", "submit it", "ha", "haan"]:
        return {"intent": "CONFIRMATION", "confidence": 0.99}
    if cleaned in ["no", "nope", "incorrect", "cancel", "stop", "na", "nahi"]:
        return {"intent": "DENIAL", "confidence": 0.99}
    if any(marker in cleaned for marker in ["there is a problem", "water problem", "problem near my house", "issue in my locality", "something wrong", "road problem", "electric problem"]):
        return {"intent": "NEEDS_CLARIFICATION", "confidence": 0.92}

    X = INTENT_VEC.transform([cleaned])
    predicted_intent = INTENT_CLF.predict(X)[0]

    if hasattr(INTENT_CLF, "predict_proba"):
        probs = INTENT_CLF.predict_proba(X)[0]
        confidence = float(np.max(probs))
    else:
        confidence = 0.90

    if confidence < 0.55:
        predicted_intent = "OUT_OF_SCOPE"
    elif predicted_intent == "CIVIC_GRIEVANCE" and confidence < 0.7:
        predicted_intent = "NEEDS_CLARIFICATION"

    return {
        "intent": predicted_intent,
        "confidence": round(confidence, 2)
    }

if __name__ == "__main__":
    input_text = sys.argv[1] if len(sys.argv) > 1 else "hi hello"
    res = predict_intent(input_text)
    print(json.dumps(res, indent=2))
