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

    native_greetings = {
        "नमस्ते", "नमस्कार", "হ্যালো", "হাই", "வணக்கம்", "ஹலோ", "నమస్తే", "హలో", "नमस्कार", "हॅलो"
    }
    if cleaned in native_greetings:
        return {"intent": "GREETING", "confidence": 0.99}

    # Native-script civic phrases must be recognized before generic denial words such as "no" or "nahi".
    native_grievance_markers = [
        # Hindi
        "पानी", "बिजली", "सड़क", "सड़क", "नाली", "कचरा", "स्ट्रीट लाइट", "ट्रांसफॉर्मर", "पाइपलाइन", "जल आपूर्ति",
        # Bengali
        "জল", "বিদ্যুৎ", "রাস্তা", "নর্দমা", "আবর্জনা", "স্ট্রিট লাইট", "পাইপলাইন",
        # Tamil
        "தண்ணீர்", "மின்சாரம்", "சாலை", "சாக்கடை", "குப்பை", "தெருவிளக்கு", "குழாய்",
        # Telugu
        "నీరు", "విద్యుత్", "రోడ్డు", "కాలువ", "చెత్త", "వీధి దీపం", "పైప్‌లైన్",
        # Marathi
        "पाणी", "वीज", "रस्ता", "नाला", "कचरा", "स्ट्रीट लाईट", "पाईपलाईन"
    ]
    if any(marker in cleaned for marker in native_grievance_markers):
        return {"intent": "GRIEVANCE", "confidence": 0.95}

    native_denials = {"नाही", "नहीं", "না", "இல்லை", "లేదు", "नको"}
    if cleaned in native_denials:
        return {"intent": "DENIAL", "confidence": 0.99}

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

    civic_markers = [
        "water supply", "no water", "water is not coming", "paani nahi", "paani ki supply",
        "pipeline", "pipe leak", "pothole", "road is broken", "road toot", "footpath", "manhole",
        "power outage", "power supply", "electricity", "bijli", "transformer", "live wire", "voltage",
        "street light", "streetlight", "dark street", "garbage", "kachra", "dustbin", "drain",
        "nali", "waterlogging", "sewage", "toilet", "mosquito", "dengue", "fogging", "traffic signal",
        "bus stop"
    ]
    if any(marker in cleaned for marker in civic_markers):
        return {"intent": "GRIEVANCE", "confidence": 0.95}

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
    elif predicted_intent == "CIVIC_GRIEVANCE":
        predicted_intent = "GRIEVANCE"

    return {
        "intent": predicted_intent,
        "confidence": round(confidence, 2)
    }

if __name__ == "__main__":
    input_text = sys.argv[1] if len(sys.argv) > 1 else "hi hello"
    res = predict_intent(input_text)
    print(json.dumps(res, indent=2))
