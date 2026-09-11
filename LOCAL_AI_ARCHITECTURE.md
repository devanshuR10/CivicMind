# Local AI Machine Learning Architecture

## JanSeva AI — Offline Grievance Classification Pipeline

---

## 1. Technical Pipeline Diagram

```
                              CITIZEN INPUT
                     (Text / Voice Speech-to-Text)
                                   │
                                   ▼
                      [ Node.js API Gateway ]
                                   │
                       (child_process.spawn)
                                   ▼
                   [ Local Python ML Service (`predict.py`) ]
                                   │
       ┌───────────────────────────┴───────────────────────────┐
       ▼                                                       ▼
[ Location Extractor ]                             [ TF-IDF Vectorizer ]
(Regex & Locality Patterns)                       (Word 1-2 & Char 3-5 n-grams)
       │                                                       │
       │                                                       ▼
       │                                          [ Local Scikit-Learn Classifiers ]
       │                                          - Department (LinearSVC)
       │                                          - Category (LinearSVC)
       │                                          - Subcategory (LinearSVC)
       │                                          - Priority (LinearSVC)
       │                                                       │
       │                                                       ▼
       │                                          [ Safety Override Layer ]
       │                                          (High-risk pattern scanner)
       │                                                       │
       │                                                       ▼
       │                                          [ Uncertainty Check ]
       │                                          (Confidence < 0.70 Threshold)
       │                                                       │
       └───────────────────────────┬───────────────────────────┘
                                   ▼
                      [ Structured Grievance JSON ]
                                   │
                                   ▼
                      [ Existing Routing & SLA Engine ]
```

---

## 2. Model Training & Evaluation Pipeline

```
[ `grievance_dataset.csv` (1,260 records) ]
                    │
                    ▼
          [ Train/Test Split (80/20) ]
                    │
                    ▼
          [ TF-IDF Feature Extraction ]
          (5,000 max features, sublinear TF)
                    │
                    ▼
     [ Model Comparison Evaluation ]
     - LinearSVC (Calibrated) 🏆 (100% Acc, F1 1.00)
     - Logistic Regression     (100% Acc, F1 1.00)
     - Multinomial Naive Bayes (100% Acc, F1 1.00)
                    │
                    ▼
    [ Multi-Output Target Classifiers ]
    - department_classifier.joblib
    - category_classifier.joblib
    - subcategory_classifier.joblib
    - priority_classifier.joblib
                    │
                    ▼
      [ joblib Artifact Persistence ]
```
