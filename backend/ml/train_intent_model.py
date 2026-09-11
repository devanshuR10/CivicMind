import os
import json
import time
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report


def train_intent_model():
    print("==================================================")
    print("  JANSEVA LOCAL INTENT CLASSIFIER TRAINING       ")
    print("==================================================")

    base_dir = os.path.dirname(__file__)
    dataset_path = os.path.join(base_dir, "data", "intent_dataset.csv")

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Intent dataset missing at {dataset_path}")

    df = pd.read_csv(dataset_path)
    print(f"Loaded intent dataset: {len(df)} total records.")

    df['cleaned_text'] = df['text'].astype(str).str.lower().str.strip()

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        df['cleaned_text'], df['intent'], test_size=0.2, random_state=42, stratify=df['intent']
    )

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=4000, sublinear_tf=True, strip_accents='unicode')
    X_train = vectorizer.fit_transform(X_train_raw)
    X_test = vectorizer.transform(X_test_raw)

    print(f"Extracted {X_train.shape[1]} TF-IDF features.")

    clf = CalibratedClassifierCV(LogisticRegression(max_iter=800, random_state=42, class_weight='balanced'))
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    _, _, f1, _ = precision_recall_fscore_support(y_test, preds, average='weighted', zero_division=0)

    print("\n--- INTENT CLASSIFICATION TEST REPORT ---")
    print(f"Accuracy: {acc*100:.2f}% | F1-Score: {f1:.4f}")
    print(classification_report(y_test, preds, zero_division=0))

    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    clf_path = os.path.join(models_dir, "intent_classifier.joblib")
    vec_path = os.path.join(models_dir, "intent_vectorizer.joblib")
    meta_path = os.path.join(models_dir, "intent_metadata.json")

    joblib.dump(clf, clf_path)
    joblib.dump(vectorizer, vec_path)

    metadata = {
        "model_name": "JanSeva Local Intent Detector",
        "version": "1.1.0",
        "algorithm": "TF-IDF + Calibrated Logistic Regression",
        "training_samples": len(df),
        "features": X_train.shape[1],
        "accuracy": round(acc, 4),
        "f1_score": round(f1, 4),
        "intents": sorted(df['intent'].unique().tolist()),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved Intent Model to {clf_path}")
    print(f"Saved Intent Vectorizer to {vec_path}")
    print("==================================================")

if __name__ == "__main__":
    train_intent_model()
