# JanSeva AI: Complete Project Guide & Pitch

This guide outlines exactly how your SIH 2026 project works end-to-end, its core technical architecture, and the major selling points you can use to pitch this to judges.

---

## 🏗️ 1. How the Project Works (The User Journey)

### Step 1: The Citizen Experience (Conversational Lodging)
1. A citizen visits the portal and opens the **AI Grievance Assistant**.
2. Instead of filling out complex, multi-page forms, the citizen simply speaks or types their problem naturally in their own language (e.g., *"There is a huge pothole near the railway station and it's causing accidents"*).
3. The **Local Machine Learning Pipeline** instantly analyzes the text, detects the intent, and extracts the core problem, the exact department it belongs to (e.g., *Public Works Department*), the severity/priority (*HIGH*), and the location.
4. If the user forgets to mention the location, the AI asks a follow-up question conversationally.
5. The citizen confirms, and the grievance is officially lodged in the system.

### Step 2: Intelligent Routing & Deduplication
1. **Auto-Routing:** The backend assigns the grievance to the specific officer in charge of that zone and department. No manual sorting by operators is needed.
2. **AI Deduplication (FAISS):** The system checks if 50 other people reported the same pothole. If so, it groups them all under a single **"Major Incident"** so the officer isn't spammed with 50 separate tickets. 

### Step 3: Officer Dashboard & SLA Enforcement
1. Officers log in and see a prioritized dashboard of grievances assigned to them.
2. **SLA Timers (Service Level Agreements):** Every grievance gets a countdown timer based on its severity (e.g., 24 hours for Critical).
3. **Auto-Escalation:** If the officer doesn't resolve it in time, a background Cron Job automatically flags the grievance and escalates it to the Senior Department Head.

### Step 4: Executive Admin Analytics
1. The Mayor or Super Admins can log in and view a birds-eye view of the city.
2. They have access to a **Database-Grounded AI Assistant** where they can type: *"Which department has the most SLA breaches?"* and get instant data-driven answers based on live database metrics.

---

## 🛠️ 2. Technical Architecture

Your project uses a modern, robust, and highly scalable tech stack:

* **Frontend:** React.js (Vite) with an intuitive, conversational UI.
* **Backend Gateway:** Node.js & Express.js handling authentication (JWT), routing, and background Cron jobs.
* **Database:** **Supabase PostgreSQL**. A highly scalable, cloud-hosted relational database that ensures data integrity and high availability.
* **AI & Machine Learning (The Core USP):**
  * **100% Offline Local Models:** Your team trained custom `scikit-learn` models (TF-IDF Vectorizers, SVC Classifiers). You are **not** reliant on paid APIs like OpenAI or Gemini. The AI runs locally, securely, and completely free of cost.
  * **Intent Classification:** Distinguishes between greetings, denials, and actual civic problems.
  * **Entity Extraction:** Categorizes text into 9 distinct government departments with dynamic priority scoring.

---

## 🏆 3. Why This Project is Better (Your Pitch/USP)

When presenting this project to hackathon judges, focus on these **Unique Selling Propositions (USPs)**:

### 1. 100% Data Privacy & Zero API Costs (Local ML)
Most competitors will just wrap the ChatGPT or Gemini API in a website. This is expensive, requires internet, and raises data privacy concerns for governments. **Your solution uses a completely local, self-trained Machine Learning pipeline**. It costs $0 to run, guarantees citizen data never leaves the government servers, and proves deep technical competence.

### 2. Radical Accessibility (Conversational UI)
Citizens don't know the difference between the "Municipal Drainage Board" and the "Water Supply Department." By allowing them to just say *"My street is flooded,"* the AI bridges the gap between everyday citizens and complex government bureaucracy.

### 3. Solves the "Spam" Problem (Deduplication)
A major problem governments face is when one broken pipe generates 500 duplicate complaints. Your FAISS-powered AI clustering groups these automatically, saving officers hundreds of hours of manual triage.

### 4. Zero Officer Complacency (Automated SLAs)
Government accountability is often low. Your system enforces strict Service Level Agreements (SLAs) with background cron jobs. If an officer ignores a ticket, their boss automatically gets notified. This guarantees timely resolution.

### 5. Enterprise-Ready Database
By migrating from a local SQLite file to **Supabase PostgreSQL**, the platform is genuinely ready to handle millions of records and concurrent users, proving it is a production-ready system, not just a hackathon toy.
