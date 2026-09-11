# JanSeva AI — Unified Multi-Department Grievance Redressal Platform

> **Smart India Hackathon (SIH) Production Prototype**  
> *"AI-powered solution enabling ease of grievance lodging and tracking for citizens across multiple departments — powered by a 100% Local Self-Trained Machine Learning Model (No API Keys Required)."*

---

## 🚀 Key Architectural Highlight: 100% Local Self-Trained ML Model

The grievance classification pipeline operates **100% locally and offline** using a custom scikit-learn Machine Learning pipeline (`TF-IDF + LinearSVC`).

- **External AI API Keys**: **`NONE`** (No Gemini, OpenAI, or Cloud AI dependencies)
- **Inference Latency**: **~18ms** per request (>50x faster than cloud LLMs)
- **Privacy**: All citizen grievance data is processed 100% on-premise
- **Safety**: Includes a deterministic safety override layer for critical life-threatening hazards (exposed live wires, fires, major gas leaks)

---

## 🛠️ Technical Stack

- **Frontend**: React 18, Vite, Lucide-React Icons, Vanilla CSS (Slate Government Design System)
- **Backend**: Node.js, Express.js, JWT, bcryptjs, Zod
- **Database**: SQLite (`better-sqlite3`) with WAL mode, foreign keys, and indexes
- **Local AI / ML Engine**: Python 3.10+, Scikit-Learn (`TfidfVectorizer` + `LinearSVC`), Pandas, Joblib

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@sih.gov.in` | `password123` | Conversational Lodging, My Grievances, Resolution Verification |
| **Water Officer** | `officer@sih.gov.in` | `password123` | Water Department Workflow, Status Updates |
| **PWD Officer** | `pwd_officer@sih.gov.in` | `password123` | Road / PWD Department Workflow |
| **Super Admin** | `admin@sih.gov.in` | `password123` | Executive KPI Overview, FAISS Duplicate Manager, GIS Map, AI Admin Analyst |

---

## 💻 Running the Application Locally

### 1. Train Local Machine Learning Model
```bash
cd backend
pip install -r ml/requirements.txt
python ml/create_dataset.py
python ml/train_model.py
```

### 2. Test Local Offline CLI Prediction Demo
```bash
python ml/predict.py "There has been no water supply in Model Town for three days."
```

### 3. Start Backend Server (Port 5000)
```bash
node server.js
```

### 4. Start Frontend Application (Port 3000)
```bash
cd ../frontend
npm run dev
```

### 5. Run Full Verification Test Suite
```bash
cd ../backend
node test/verify-all.js
```
