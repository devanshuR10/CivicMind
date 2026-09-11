# Local AI Machine Learning QA & Verification Report

**Project Title**: JanSeva AI — Offline Local Grievance Classifier  
**Audit Date**: September 6, 2026  
**Auditor**: Lead Full-Stack & AI Engineer  
**Status**: 100% Offline Local Model Active — Zero Cloud AI Dependency  

---

## 1. Executive Summary

The grievance classification engine runs as a **100% local, self-trained Scikit-Learn Machine Learning pipeline** (`TF-IDF + LinearSVC`) with **zero external API dependencies**.

| Metric | Value |
| :--- | :--- |
| External AI API Key Requirement | **NONE** |
| Dataset Size | **1,800** correlated civic grievance records |
| ML Algorithm | `LinearSVC` (CalibratedClassifierCV) + `TfidfVectorizer` (word 1-3 grams + char 3-5 grams) |
| TF-IDF Feature Count | **3,822** features |
| Training Accuracy (all targets) | **100.00%** |
| Unseen Test Suite Accuracy | **100.00% (34 / 34)** |
| Water Hard-Negative Accuracy | **100.00% (34 / 34)** |
| Intent Classification Accuracy | **100.00% (43 / 43)** |
| Average Inference Latency | **~20ms** per request |
| Offline Verified | Yes - Network-disconnected test confirmed |

---

## 2. Verification Test Results Matrix

| Test Suite | Command | Result | Score |
| :--- | :--- | :---: | :--- |
| **Model Training** | `python ml/train_model.py` | PASS | Hierarchical dept/category/subcategory/priority classifiers trained |
| **Unseen Grievance Tests** | `python ml/test_model.py` | PASS | **34 / 34** (100.00%) |
| **Water Hard-Negative Suite** | `python ml/test_water_classification.py` | PASS | **34 / 34** (100.00%) |
| **Intent Classifier** | `python ml/test_intent_model.py` | PASS | **43 / 43** (100.00%) |
| **Phase 2 Grievance Lodging** | `node test/test-phase2.js` | PASS | **10 / 10** (100.00%) |
| **Full Platform Verification** | `node test/verify-all.js` | PASS | **7 / 7** (100.00%) |
| **CLI Demo Inference** | `python ml/predict.py "<text>"` | PASS | JSON + subcategory probabilities + explainable features |
| **Cloud API Removal** | `@google/generative-ai` purge | PASS | Dependency and GEMINI_API_KEY completely removed |

---

## 3. Two-Stage Local AI Pipeline

```
User Message
    |
    v
+-----------------------------------------+
|  STAGE 1 - Intent Classifier            |
|  predict_intent.py                      |
|  TF-IDF + Calibrated LogisticReg        |
|  -> GREETING / CAPABILITIES /           |
|     THANKS / DENIAL / GRIEVANCE         |
+-----------+-----------------------------+
            | if GRIEVANCE
            v
+-----------------------------------------+
|  STAGE 2A - Global Classifiers          |
|  predict.py                             |
|  TF-IDF + Calibrated LinearSVC          |
|  -> Department, Category, Priority      |
+-----------+-----------------------------+
            |
            v
+-----------------------------------------+
|  STAGE 2B - Hierarchical Subcategory    |
|  {Category}_subcategory_clf.joblib      |
|  Category-scoped LinearSVC             |
|  -> Subcategory + Probabilities         |
+-----------------------------------------+
```

### Why Hierarchical?
A single flat subcategory classifier confused `Water Pipeline Leakage` with `No Water Supply` because both contain the words "water", "road", "pipe". The **category-scoped subcategory classifier** only competes within the `Water Supply` class, giving it perfect resolution.

---

## 4. Key Classification Examples

| Input | Department | Subcategory | Priority |
| :--- | :--- | :--- | :--- |
| "i am rahul shamram i am fine so the problem is that there is a road on that road there is a pipe that is leaking and road is full of water" | Water Department | **Water Pipeline Leakage** | HIGH |
| "fogging karwao area me, dengue phail raha hai" | **Public Health Department** | Vector Disease Control | HIGH |
| "Sewage chamber overflowing on the walking pavement." | **Sanitation Department** | Sewage Overflow | HIGH |
| "There is a huge pothole on the main road" | **Public Works Department** | Dangerous Pothole | HIGH |
| "hi" / "hello" / "how are you" | — | **GREETING (no classification)** | — |

---

## 5. Supported Departments & Categories

| Department | Category | Subcategories |
| :--- | :--- | :--- |
| Water Department | Water Supply | No Water Supply, Water Pipeline Leakage, Contaminated / Dirty Water, Low Water Pressure |
| Public Works Department | Roads / PWD | Dangerous Pothole, Road Repair Needed, Broken Footpath, Incomplete Road Construction, Open Manhole Hazard |
| Electricity Department | Electricity | Exposed Electrical Hazard, Power Outage, Transformer Sparking, Damaged Electric Pole |
| Sanitation Department | Sanitation | Public Toilet Cleaning, Sewage Overflow, Foul Smell / Unsanitary Area |
| Municipal Drainage Department | Drainage | Drainage Overflow, Waterlogging, Clogged Gutter |
| Electrical & Lighting Department | Street Lighting | Streetlight Off, Broken Lamp Pole, Dark Road Safety Concern |
| Sanitation & Waste Department | Waste Management | Uncollected Garbage, Open Waste Dumping, Garbage Dustbin Overflow |
| Public Health Department | Public Health | Mosquito Breeding Hazard, Vector Disease Control, Disease Outbreak |
| Municipal Transport Department | Transport | Traffic Signal Defect, Bus Stop Damage |

---

## 6. Supported Languages

- **English**: Full native support across all 9 civic departments.
- **Hinglish / Hindi-English**: "hamare area me paani nahi aa raha", "road toota hua hai", "fogging karwao dengue phail raha hai"
- **Pure Devanagari Hindi**: Auto-detected via Unicode range and mapped to category schema.

---

## 7. Setup & Running Instructions

```bash
# 1. Regenerate Dataset
cd backend
python ml/create_dataset.py

# 2. Train Local Model
python ml/train_model.py

# 3. Test Local Prediction CLI
python ml/predict.py "There is no water supply in Model Town for three days."

# 4. Run Full Test Suites
python ml/test_model.py
python ml/test_water_classification.py
python ml/test_intent_model.py
node test/test-phase2.js
node test/verify-all.js

# 5. Start Backend Server (100% Offline, no API keys needed)
node server.js
```

---

## 8. Model File Artifacts

| File | Purpose |
| :--- | :--- |
| `ml/models/tfidf_vectorizer.joblib` | Shared TF-IDF feature extractor |
| `ml/models/department_classifier.joblib` | Global department classifier |
| `ml/models/category_classifier.joblib` | Global category classifier |
| `ml/models/priority_classifier.joblib` | Global priority classifier |
| `ml/models/category_models/Water_Supply_subcategory_clf.joblib` | Water Supply subcategory (hierarchical) |
| `ml/models/category_models/Roads___PWD_subcategory_clf.joblib` | Roads/PWD subcategory (hierarchical) |
| `ml/models/category_models/...` | One file per category |
| `ml/models/intent_classifier.joblib` | Intent classifier (GRIEVANCE vs chit-chat) |
| `ml/models/intent_vectorizer.joblib` | Intent TF-IDF vectorizer |
