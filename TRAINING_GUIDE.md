# Machine Learning Training & Retraining Guide

Follow these instructions to train, evaluate, and test the JanSeva Local Machine Learning model from scratch.

---

## 1. Prerequisites & Environment Setup

Navigate to the `backend` directory and ensure Python 3.10+ is installed:
```bash
cd backend
pip install -r ml/requirements.txt
```

---

## 2. Dataset Generation / Modification

To generate or rebuild the training dataset (`backend/ml/data/grievance_dataset.csv`):
```bash
python ml/create_dataset.py
```
To add custom training data, open `backend/ml/data/grievance_dataset.csv` and append rows matching:
`text,department,category,subcategory,priority`

---

## 3. Train & Save Model Artifacts

Execute model training and candidate selection:
```bash
python ml/train_model.py
```
This trains TF-IDF vectorizer and multi-output classifiers, saving outputs to `backend/ml/models/`:
- `tfidf_vectorizer.joblib`
- `department_classifier.joblib`
- `category_classifier.joblib`
- `subcategory_classifier.joblib`
- `priority_classifier.joblib`
- `model_metadata.json`

---

## 4. Evaluate Saved Models

Run full validation evaluation and print classification metrics:
```bash
python ml/evaluate_model.py
```

---

## 5. Test Unseen Complaints Test Suite

Execute the 34 unseen complaint test suite:
```bash
python ml/test_model.py
```

---

## 6. Offline CLI Inference Demo

Run a prediction directly from the command line:
```bash
python ml/predict.py "There is no water supply in Model Town for three days."
```
