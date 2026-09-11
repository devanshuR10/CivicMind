import os
import json
import joblib
import pandas as pd
from sklearn.metrics import classification_report, accuracy_score, f1_score

def evaluate_saved_models():
    base_dir = os.path.dirname(__file__)
    models_dir = os.path.join(base_dir, "models")
    data_path = os.path.join(base_dir, "data", "grievance_dataset.csv")

    vec_path = os.path.join(models_dir, "tfidf_vectorizer.joblib")
    if not os.path.exists(vec_path):
        raise FileNotFoundError("Trained vectorizer not found. Run train_model.py first.")

    vectorizer = joblib.load(vec_path)
    df = pd.read_csv(data_path)
    df['cleaned_text'] = df['text'].astype(str).str.lower().str.strip()

    X = vectorizer.transform(df['cleaned_text'])

    print("==================================================")
    print("  SAVED MODEL EVALUATION & PERFORMANCE SUMMARY    ")
    print("==================================================")

    targets = ['department', 'category', 'subcategory', 'priority']
    for target in targets:
        model_path = os.path.join(models_dir, f"{target}_classifier.joblib")
        if not os.path.exists(model_path):
            print(f"Model for {target} not found at {model_path}")
            continue

        clf = joblib.load(model_path)
        preds = clf.predict(X)
        acc = accuracy_score(df[target], preds)
        f1 = f1_score(df[target], preds, average='weighted', zero_division=0)

        print(f"\n--- TARGET: {target.upper()} ---")
        print(f"Accuracy: {acc*100:.2f}% | F1-Score: {f1:.4f}")
        print(classification_report(df[target], preds, zero_division=0))

if __name__ == "__main__":
    evaluate_saved_models()
