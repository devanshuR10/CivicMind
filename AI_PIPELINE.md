# AI Pipeline Documentation — Local Offline ML Architecture

---

## 1. Local Text Classification Machine Learning Pipeline

```
Citizen Input (Text / Voice Speech-to-Text)
           │
           ▼
[ Regex Location Extractor (`ml/location_extractor.py`) ]
           │
           ▼
[ TF-IDF Vectorizer (`tfidf_vectorizer.joblib`) ]
(Word 1-2 & Char 3-5 n-grams, 1,146 features)
           │
           ▼
[ Multi-Output Scikit-Learn Classifiers (`LinearSVC`) ]
- Department Classifier
- Category Classifier
- Subcategory Classifier
- Priority Classifier
           │
           ▼
[ Priority Safety Override Layer ]
(Scans for exposed live wires, fires, gas leaks → CRITICAL)
           │
           ▼
[ Confidence Threshold Check ]
(If Confidence < 0.70 → triggers `needs_clarification`)
           │
           ▼
[ Structured Grievance JSON Output ]
```

---

## 2. FAISS Vector Duplicate Detection & Clustering Engine

```
New Complaint Registered
           │
           ▼
[ Python Microservice: `backend/ml/duplicate_detector.py` ]
           │
 ┌─────────┴────────────────────────┐
 ▼                                  ▼
[ TF-IDF Sentence Similarity ]     [ Haversine Spatial Distance ]
           │                                  │
           └────────────────┬─────────────────┘
                            ▼
           [ Combined Similarity Score ]
                            │
               (If Score >= 0.45 or Match)
                            ▼
          Flagged as "POSSIBLE DUPLICATE"
           Grouped into master `INCIDENT-XXXX`
```

---

## 3. Grounded SQL Analytics Engine

Executive analytics answers are derived 100% locally by executing structured SQL query aggregations against live database tables, completely eliminating cloud LLM dependencies and metric hallucination risks.
