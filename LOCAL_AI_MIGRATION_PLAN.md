# Local Machine Learning Migration Plan

**Project Title**: JanSeva AI — Local Grievance Classifier Migration  
**Objective**: Complete removal of Gemini / OpenAI / Cloud AI APIs for grievance classification, replacing them with a local, self-trained Scikit-Learn NLP Machine Learning pipeline (`TF-IDF + LinearSVC/LogisticRegression`) running 100% offline.

---

## 1. Audit of Existing Gemini Usage

### Current AI Invocations:
1. **`backend/services/aiService.js`**: Imports `@google/generative-ai`. Calls `gemini-1.5-flash` to parse complaint text into structured JSON. Includes a fallback heuristic parser.
2. **`backend/routes/ai.js`**:
   - `POST /api/ai/parse-complaint`: Uses `parseGrievanceText` from `aiService.js`.
   - `POST /api/ai/admin-assistant`: Formats SQL metrics context and queries Gemini model for executive answers.
3. **`backend/package.json`**: Dependencies include `"@google/generative-ai": "^0.24.0"`.

---

## 2. Target Architecture Replacement

- **Removal**:
  - Remove `@google/generative-ai` package dependency.
  - Remove `GEMINI_API_KEY` requirement from `.env`.
  - Eliminate external cloud API network calls for grievance classification.

- **Replacement**:
  - Build `backend/ml/data/grievance_dataset.csv` with 1,200+ realistic civic grievance examples covering 9 departments in English and Hinglish.
  - Train local scikit-learn models (`backend/ml/train_model.py`) evaluating Logistic Regression, LinearSVC, and Naive Bayes.
  - Save trained vectorizer and multi-output classifiers using `joblib` (`backend/ml/models/`).
  - Create offline Python inference CLI (`backend/ml/predict.py`) and regex location extractor (`backend/ml/location_extractor.py`).
  - Create `backend/services/localAIService.js` in Node.js using safe `child_process.spawn` to query the trained local model.
  - Retain SQL database-grounded analytics for Admin QA without cloud LLM reliance.

---

## 3. Dataset Design & Model Architecture

### Dataset Schema (`grievance_dataset.csv`):
- `text`: Complaint text in English / Hinglish / regional syntax.
- `department`: Target department (Water, PWD, Electricity, Sanitation, Drainage, Street Lighting, Waste, Health, Transport).
- `category`: Target category matching system schema.
- `subcategory`: Detailed subcategory string.
- `priority`: Target priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### Model Pipeline:
- **Vectorizer**: Word (1-2 gram) & Char (3-5 gram) TF-IDF Vectorizer.
- **Classifier**: Multi-output classifier or dedicated target classifiers (`LinearSVC` / `LogisticRegression` with calibrated probabilities via Platt scaling / Decision Function).
- **Safety Override Layer**: High-risk pattern scanner for critical hazards (exposed wires, fire, major flooding, gas leaks) to upgrade priority to `CRITICAL`.
- **Uncertainty Threshold**: If model confidence < 0.70, returns `needs_clarification: true`.

---

## 4. Execution Phases Roadmap

1. **Phase 1**: Architecture Audit & Migration Plan Documentation (`LOCAL_AI_MIGRATION_PLAN.md`).
2. **Phase 2**: Dataset Creation (`backend/ml/data/grievance_dataset.csv` & `data/README.md`) with 1,200+ samples.
3. **Phase 3**: Model Training & Evaluation Script (`backend/ml/train_model.py` & `evaluate_model.py`).
4. **Phase 4**: Multi-Output Classifier & Priority Intelligence with Safety Overrides.
5. **Phase 5**: Location Extractor (`backend/ml/location_extractor.py`).
6. **Phase 6**: Offline CLI Inference (`backend/ml/predict.py`).
7. **Phase 7**: Node.js Local AI Integration (`backend/services/localAIService.js`).
8. **Phase 8**: Deprecate Gemini API Dependencies & Update `.env`.
9. **Phase 9**: Model Testing (`backend/ml/test_model.py`) & Comparison Report (`MODEL_COMPARISON.md`).
10. **Phase 10**: Offline End-to-End Verification & Local QA Report (`LOCAL_AI_QA_REPORT.md`).
