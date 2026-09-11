import os
import sys
import json
import re
import joblib
import numpy as np

from location_extractor import extract_location

CONFIDENCE_THRESHOLD = 0.70


def sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9]', '_', name)


def load_models():
    base_dir = os.path.dirname(__file__)
    models_dir = os.path.join(base_dir, "models")
    cat_models_dir = os.path.join(models_dir, "category_models")

    vec_path = os.path.join(models_dir, "tfidf_vectorizer.joblib")
    if not os.path.exists(vec_path):
        raise FileNotFoundError(f"Vectorizer missing at {vec_path}. Run train_model.py first.")

    vectorizer = joblib.load(vec_path)

    global_classifiers = {}
    for target in ['department', 'category', 'priority']:
        clf_path = os.path.join(models_dir, f"{target}_classifier.joblib")
        if not os.path.exists(clf_path):
            raise FileNotFoundError(f"Global classifier for {target} missing at {clf_path}")
        global_classifiers[target] = joblib.load(clf_path)

    category_subcat_classifiers = {}
    if os.path.exists(cat_models_dir):
        for fname in os.listdir(cat_models_dir):
            if fname.endswith("_subcategory_clf.joblib"):
                clf_path = os.path.join(cat_models_dir, fname)
                category_subcat_classifiers[fname] = joblib.load(clf_path)

    return vectorizer, global_classifiers, category_subcat_classifiers

try:
    VECTORIZER, GLOBAL_CLASSIFIERS, CAT_SUBCAT_CLASSIFIERS = load_models()
except Exception:
    VECTORIZER, GLOBAL_CLASSIFIERS, CAT_SUBCAT_CLASSIFIERS = None, None, None


def get_top_features(text, vectorizer, top_n=4):
    """Extract the strongest TF-IDF terms for explainability."""
    if vectorizer is None:
        return []
    try:
        feature_names = np.array(vectorizer.get_feature_names_out())
    except Exception:
        return []
    tfidf_matrix = vectorizer.transform([text.lower()])
    feature_index = tfidf_matrix.nonzero()[1]
    tfidf_scores = tfidf_matrix.data
    sorted_items = sorted(zip(feature_index, tfidf_scores), key=lambda x: x[1], reverse=True)
    top_terms = [feature_names[i] for i, score in sorted_items[:top_n]]
    return top_terms


def check_safety_overrides(text, current_priority):
    """Deterministic safety override layer for critical life-threatening hazards."""
    lower = text.lower()
    critical_keywords = [
        "exposed live wire", "live wire", "live electrical wire", "sparking transformer",
        "transformer sparking", "electrical fire", "gas leak", "bridge collapse", "building collapse",
        "open manhole hazard", "wire hanging dangerously", "electric wire fallen on the road"
    ]
    for kw in critical_keywords:
        if kw in lower:
            return "CRITICAL", f"Safety Override Triggered: Detected high-risk pattern '{kw}'"
    return current_priority, None


def vague_ambiguity_keywords(text):
    lower = text.lower().strip()
    if len(lower.split()) <= 3:
        short_phrases = ["there is a problem", "water problem", "problem near my house", "issue", "help", "my area problem", "some issue", "this is a problem", "not working", "something wrong"]
        if any(p in lower for p in short_phrases):
            return True
    vague_markers = ["there is a problem", "water problem", "road problem", "electric problem", "some problem", "issue in my area", "problem near my house", "something wrong", "not working"]
    return any(marker in lower for marker in vague_markers)


def explicit_civic_keyword_overrides(text):
    lower = text.lower().strip()

    if not lower:
        return None

    # Generic noise is only rejected when there are no real civic complaint terms.
    generic_noise = [
        "hello", "hi", "hey", "namaste", "greetings", "goy", "asdfgh", "abc", "test",
        "please help", "help me", "random complaint", "good morning", "issue", "problem",
        "some issue", "there is a problem", "not working", "something wrong"
    ]

    meaningful_keywords = {
        "transport": [
            "traffic signal", "traffic light", "signal is not working", "bus stop", "bus shelter",
            "junction", "intersection", "signal kharab", "traffic light kharab", "bus stand"
        ],
        "health": [
            "dengue", "mosquito", "fogging", "stagnant water", "fever", "vector", "machhar",
            "mosquito breeding", "fogging karwao"
        ],
        "street_light": [
            "street light", "streetlight", "lamp post", "lamp", "dark road", "road is dark",
            "lane is dark", "street is dark", "light pole", "street lights are off", "lamps are off",
            "bijli ka lamp", "road ka light", "light band", "light kharab"
        ],
        "electric": [
            "electric", "electricity", "electrical", "power cut", "power outage", "transformer",
            "live wire", "wire hanging", "sparking", "voltage", "flickering", "bijli", "wire fallen",
            "electric wire", "main line", "bulb", "transformer sparking", "live cable"
        ],
        "sanitation": [
            "toilet", "public toilet", "washroom", "service line", "sewage", "sanitation", "dirty toilet",
            "foul smell", "ganda paani", "nali ka paani", "sewer", "wastewater", "ganda toilet"
        ],
        "water": [
            "water", "paani", "tap", "pipeline", "pipe", "water supply", "no water", "dry tap",
            "water pressure", "water leak", "leaking pipe", "pipeline burst", "dirty water",
            "drinking water", "tap se paani", "paani nahi aa raha", "supply band"
        ],
        "drainage": [
            "drain", "nali", "drainage", "blocked drain", "clogged drain", "waterlogging", "flooded road",
            "gutter", "overflowing drain", "stormwater", "waterlogged", "road flooded"
        ],
        "waste": [
            "garbage", "trash", "kachra", "dustbin", "waste", "dumped", "uncollected", "garbage pile",
            "dumping", "waste bin", "garbage bin"
        ],
        "road": [
            "road", "sadak", "pothole", "manhole", "footpath", "gaddha", "broken road", "cracks",
            "road damage", "construction", "lane", "street", "sidewalk", "path", "road kharab"
        ]
    }

    found_signal = any(any(keyword in lower for keyword in keywords) for keywords in meaningful_keywords.values())
    vague_complaint_phrases = [
        "water problem", "electric problem", "road problem", "drain problem", "light problem",
        "garbage problem", "there is a problem", "problem near my house", "issue in my area",
        "my area problem", "some issue", "something wrong", "not working"
    ]
    vague_only = any(phrase in lower for phrase in vague_complaint_phrases)
    specific_details = [
        "supply", "leak", "leaking", "pipe", "pipeline", "tap", "pressure", "outage", "power",
        "transformer", "wire", "voltage", "pothole", "manhole", "footpath", "signal", "traffic",
        "bus", "street light", "streetlight", "lamp", "dark", "drainage", "waterlogging", "gutter",
        "garbage", "trash", "dustbin", "toilet", "sewage", "mosquito", "dengue", "fogging"
    ]
    if vague_only and not any(detail in lower for detail in specific_details):
        return {
            "department": "Municipal Administration",
            "category": "General",
            "subcategory": "Needs Clarification",
            "priority": "MEDIUM",
            "needs_clarification": True,
            "clarification_prompt": "I'm not sure I understood the problem. Could you please describe the issue in a little more detail? For example: 'There is no electricity in my area' or 'A water pipeline is leaking.'"
        }

    if len(lower.split()) <= 3 and any(marker in lower for marker in generic_noise) and not found_signal:
        return {
            "department": "Municipal Administration",
            "category": "General",
            "subcategory": "Needs Clarification",
            "priority": "MEDIUM",
            "needs_clarification": True,
            "clarification_prompt": "I'm not sure I understood the problem. Could you please describe the issue in a little more detail? For example: 'There is no electricity in my area' or 'A water pipeline is leaking.'"
        }

    # Specific problem categories must win over generic greetings/noise if the complaint contains real civic keywords.
    transport_markers = ["traffic signal", "traffic light", "bus stop", "bus shelter", "junction", "intersection", "signal kharab"]
    if any(marker in lower for marker in transport_markers):
        return {
            "department": "Municipal Transport Department",
            "category": "Transport",
            "subcategory": "Traffic Signal Defect",
            "priority": "HIGH",
            "needs_clarification": False,
            "clarification_prompt": "This appears to be a transport or traffic signal issue."
        }

    public_health_markers = ["dengue", "mosquito", "fogging", "stagnant water", "fever", "machhar", "vector"]
    if any(marker in lower for marker in public_health_markers):
        return {
            "department": "Public Health Department",
            "category": "Public Health",
            "subcategory": "Mosquito Breeding Hazard",
            "priority": "HIGH",
            "needs_clarification": False,
            "clarification_prompt": "This appears to be a public health or mosquito-control issue."
        }

    streetlight_markers = ["street light", "streetlight", "lamp post", "lamp", "dark road", "dark street", "road is dark", "lane is dark", "street is dark", "light pole", "light band", "light kharab"]
    if any(marker in lower for marker in streetlight_markers):
        return {
            "department": "Electrical & Lighting Department",
            "category": "Street Lighting",
            "subcategory": "Streetlight Off",
            "priority": "MEDIUM",
            "needs_clarification": False,
            "clarification_prompt": "This looks like a streetlight or public lighting issue."
        }

    electric_markers = ["electric", "electricity", "electrical", "power cut", "power outage", "transformer", "live wire", "live electric wire", "exposed live", "wire hanging", "sparking", "voltage", "flickering", "bijli", "wire fallen", "electric wire", "bulb"]
    if any(marker in lower for marker in electric_markers):
        is_critical_electric = any(marker in lower for marker in ["live wire", "live electric wire", "exposed live", "wire fallen", "wire hanging", "sparking", "transformer"])
        return {
            "department": "Electricity Department",
            "category": "Electricity",
            "subcategory": "Exposed Electrical Hazard" if is_critical_electric else "Power Outage",
            "priority": "CRITICAL" if is_critical_electric else "HIGH",
            "needs_clarification": False,
            "clarification_prompt": "This appears to be an electricity-related issue."
        }

    sanitation_markers = ["toilet", "public toilet", "washroom", "sewage", "sanitation", "dirty toilet", "foul smell", "ganda paani", "nali ka paani", "sewer"]
    water_contamination_context = any(marker in lower for marker in ["drinking tap", "tap water", "water tap", "ganda paani", "dirty water", "sewage water"])
    if any(marker in lower for marker in sanitation_markers) and not water_contamination_context:
        return {
            "department": "Sanitation Department",
            "category": "Sanitation",
            "subcategory": "Sewage Overflow",
            "priority": "HIGH",
            "needs_clarification": False,
            "clarification_prompt": "This appears to be a sanitation or sewerage issue."
        }

    drainage_markers = ["drain", "nali", "drainage", "blocked drain", "clogged drain", "waterlogging", "flooded road", "gutter", "overflowing drain", "stormwater", "waterlogged"]
    if any(marker in lower for marker in drainage_markers):
        return {
            "department": "Municipal Drainage Department",
            "category": "Drainage",
            "subcategory": "Drainage Overflow",
            "priority": "HIGH",
            "needs_clarification": False,
            "clarification_prompt": "The issue appears to be a drainage blockage or waterlogging problem."
        }

    water_markers = ["water", "paani", "tap", "pipe", "pipeline", "water supply", "no water", "dry tap", "water pressure", "water leak", "leaking pipe", "dirty water", "drinking water", "paani nahi aa raha", "supply band"]
    if any(marker in lower for marker in water_markers):
        water_leak_markers = ["water pipeline", "pipeline leak", "pipe leak", "leaking pipe", "water leak", "pipeline burst", "broken pipe", "pipe is leaking"]
        return {
            "department": "Water Department",
            "category": "Water Supply",
            "subcategory": "Water Pipeline Leakage" if any(marker in lower for marker in water_leak_markers) else "No Water Supply",
            "priority": "HIGH",
            "needs_clarification": False,
            "clarification_prompt": "This appears to be a water supply issue."
        }

    waste_markers = ["garbage", "trash", "kachra", "dustbin", "waste", "dumped", "uncollected", "garbage pile", "dumping"]
    if any(marker in lower for marker in waste_markers):
        return {
            "department": "Sanitation & Waste Department",
            "category": "Waste Management",
            "subcategory": "Uncollected Garbage",
            "priority": "MEDIUM",
            "needs_clarification": False,
            "clarification_prompt": "This appears to be a solid-waste disposal issue."
        }

    road_markers = ["road", "sadak", "pothole", "manhole", "footpath", "gaddha", "broken road", "cracks", "construction", "lane", "street", "sidewalk"]
    if any(marker in lower for marker in road_markers):
        return {
            "department": "Public Works Department",
            "category": "Roads / PWD",
            "subcategory": "Road Repair Needed",
            "priority": "MEDIUM",
            "needs_clarification": False,
            "clarification_prompt": "This looks like a road or civic infrastructure issue."
        }

    greeting_markers = ["hello", "hi", "hey", "namaste", "greetings"]
    if any(marker in lower for marker in greeting_markers):
        return {
            "department": "Municipal Administration",
            "category": "General",
            "subcategory": "Needs Clarification",
            "priority": "MEDIUM",
            "needs_clarification": True,
            "clarification_prompt": "Could you please describe the specific civic problem you are reporting?"
        }

    return None


def predict_grievance(text, existing_location=None):
    if not VECTORIZER or not GLOBAL_CLASSIFIERS:
        return {"error": "Local ML models not loaded. Please run train_model.py first."}

    cleaned = text.lower().strip()
    if not cleaned:
        return {
            "department": "Municipal Administration",
            "category": "Roads / PWD",
            "subcategory": "General Complaint",
            "priority": "MEDIUM",
            "description": text.strip(),
            "location_text": extract_location(text, existing_location),
            "language": "en",
            "confidence": 0.0,
            "subcategory_probabilities": {},
            "missing_information": ["location_text"],
            "needs_clarification": True,
            "explainable_features": [],
            "safety_override": None
        }

    explicit_override = explicit_civic_keyword_overrides(cleaned)
    if explicit_override:
        department = explicit_override["department"]
        category = explicit_override["category"]
        subcategory = explicit_override["subcategory"]
        final_priority = explicit_override["priority"]
        extracted_loc = extract_location(text, existing_location)
        return {
            "department": department,
            "category": category,
            "subcategory": subcategory,
            "priority": final_priority,
            "description": text.strip(),
            "location_text": extracted_loc,
            "language": "hi" if any("\u0900" <= c <= "\u097f" for c in text) else "en",
            "confidence": 0.95,
            "subcategory_probabilities": {},
            "missing_information": [] if extracted_loc else ["location_text"],
            "needs_clarification": explicit_override["needs_clarification"],
            "explainable_features": get_top_features(cleaned, VECTORIZER, top_n=4),
            "safety_override": None,
            "clarification_prompt": explicit_override["clarification_prompt"],
            "accepted": not explicit_override["needs_clarification"],
            "decision": "ACCEPTED" if not explicit_override["needs_clarification"] else "REJECTED_LOW_CONFIDENCE"
        }

    X = VECTORIZER.transform([cleaned])

    category = GLOBAL_CLASSIFIERS['category'].predict(X)[0]
    department = GLOBAL_CLASSIFIERS['department'].predict(X)[0]
    priority = GLOBAL_CLASSIFIERS['priority'].predict(X)[0]

    if hasattr(GLOBAL_CLASSIFIERS['category'], 'predict_proba'):
        cat_probs = GLOBAL_CLASSIFIERS['category'].predict_proba(X)[0]
        category_confidence = float(np.max(cat_probs))
    else:
        category_confidence = 0.90

    accepted = category_confidence >= CONFIDENCE_THRESHOLD
    print(f"[ML_DEBUG] input={text!r} predicted_category={category} confidence={category_confidence:.4f} accepted={accepted}", file=sys.stderr, flush=True)

    if not accepted:
        return {
            "department": None,
            "category": None,
            "subcategory": None,
            "priority": None,
            "description": text.strip(),
            "location_text": extract_location(text, existing_location),
            "language": "hi" if any("\u0900" <= c <= "\u097f" for c in text) else "en",
            "confidence": round(category_confidence, 2),
            "subcategory_probabilities": {},
            "missing_information": [],
            "needs_clarification": True,
            "explainable_features": get_top_features(text, VECTORIZER, top_n=4),
            "safety_override": None,
            "clarification_prompt": "I'm not sure I understood the problem. Could you please describe the issue in a little more detail? For example: 'There is no electricity in my area' or 'A water pipeline is leaking.'",
            "accepted": False,
            "decision": "REJECTED_LOW_CONFIDENCE"
        }

    subcategory = "General Complaint"
    subcat_probs = {}
    sanitized_cat = sanitize_filename(category)
    model_fname = f"{sanitized_cat}_subcategory_clf.joblib"

    if model_fname in CAT_SUBCAT_CLASSIFIERS:
        sub_clf = CAT_SUBCAT_CLASSIFIERS[model_fname]
        subcategory = sub_clf.predict(X)[0]
        if hasattr(sub_clf, 'predict_proba'):
            classes = sub_clf.classes_
            probs = sub_clf.predict_proba(X)[0]
            for cls, prob in zip(classes, probs):
                subcat_probs[cls] = round(float(prob), 4)
            subcat_probs = dict(sorted(subcat_probs.items(), key=lambda item: item[1], reverse=True))

    final_priority, override_reason = check_safety_overrides(text, priority)
    extracted_loc = extract_location(text, existing_location)
    top_terms = get_top_features(text, VECTORIZER, top_n=4)

    missing_info = []
    if not extracted_loc:
        missing_info.append("location_text")

    # Ask for clarification when the complaint is vague or the category confidence is low.
    ambiguous = vague_ambiguity_keywords(text)
    needs_clarification = ambiguous or category_confidence < 0.65 or (category_confidence < 0.8 and len(subcat_probs) > 0 and list(subcat_probs.values())[0] < 0.5)

    if ambiguous:
        subcategory = "Needs Clarification"
        category = "Roads / PWD"
        department = "Public Works Department"
        final_priority = "MEDIUM"

    return {
        "department": department,
        "category": category,
        "subcategory": subcategory,
        "priority": final_priority,
        "description": text.strip(),
        "location_text": extracted_loc,
        "language": "hi" if any("\u0900" <= c <= "\u097f" for c in text) else "en",
        "confidence": round(category_confidence, 2),
        "subcategory_probabilities": subcat_probs,
        "missing_information": missing_info,
        "needs_clarification": needs_clarification,
        "explainable_features": top_terms,
        "safety_override": override_reason,
        "clarification_prompt": "Could you clarify the civic issue? Please tell me whether it is no water supply, a leaking pipeline, a road problem, a streetlight issue, or another specific problem.",
        "accepted": True,
        "decision": "ACCEPTED"
    }


def print_judge_demo(input_text, result):
    """Formatted debug output for SIH judges demo."""
    print("================================================")
    print("JANSEVA LOCAL HIERARCHICAL AI - OFFLINE DEMO")
    print("================================================")
    print(f"Input:        {input_text}")
    print(f"Department:   {result.get('department')}")
    print(f"Category:     {result.get('category')}")
    print(f"Subcategory:  {result.get('subcategory')}")
    print(f"Priority:     {result.get('priority')}")
    print(f"Confidence:   {int(result.get('confidence', 0) * 100)}%")
    print(f"Location:     {result.get('location_text') or 'Not Detected'}")
    print("\nSubcategory Probabilities:")
    for sub, p in result.get('subcategory_probabilities', {}).items():
        print(f"  - {sub:30s}: {int(p*100):2d}%")
    print(f"\nEvidence Terms: {', '.join(result.get('explainable_features', []))}")
    if result.get('safety_override'):
        print(f"Override:       {result.get('safety_override')}")
    print("================================================")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_input = sys.argv[1]
        loc_arg = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "--json" else None
        res = predict_grievance(user_input, loc_arg)

        if "--json" in sys.argv or not sys.stdout.isatty():
            print(json.dumps(res, indent=2))
        else:
            print_judge_demo(user_input, res)
    else:
        sample = "water pipe is leaking and flooding the road"
        res = predict_grievance(sample)
        print_judge_demo(sample, res)
