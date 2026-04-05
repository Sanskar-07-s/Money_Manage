# AI Personal Finance Tracker (MoneyManage)

A professional, industrial-grade SaaS application for personal finance tracking, featuring AI-powered transaction parsing, real-time analytics, and secure hybrid cloud synchronization.

![MoneyManage Dashboard](https://github.com/Sanskar-07-s.github.io/MoneyManage/preview.png)

## 🚀 Key Features

- **AI-Powered Assistant**: Chat with your financial data. Use natural language to log expenses, check balances, and get spending insights.
- **Hybrid Storage Engine**: Works offline with `localStorage` and automatically reconciles with **Firebase Firestore** when online.
- **Dynamic Analytics**: Interactive Recharts-based dashboards with cash flow trends and categorical spend breakdowns.
- **Identity Center**: Secure Firebase Authentication with persistent user profiles and avatar management.
- **Pro Data Control**: 
  - **Export Report**: Download full financial ledgers as JSON or high-fidelity PNG reports.
  - **Secure Purge**: Dedicated options to clear AI history or delete all account data permanently.
- **Mobile-Ready UI**: Premium Glassmorphism design system, fully responsive with bottom navigation for mobile viewports.

## 🛠️ Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend**: Node.js + Express, Firebase Admin SDK.
- **AI/ML**: OpenAI GPT-4o-Mini / OpenRouter for intent parsing and context-aware responses.
- **Database**: Firebase Firestore (NoSQL) with sub-collection architecture.
- **Auth**: Firebase Authentication (Email/Password).

## 📂 Project Structure

```text
money_manage/
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── components/  # Reusable UI (GlassBox, StatCard, Layout)
│   │   ├── hooks/       # useAutoSync, useAuth
│   │   ├── services/    # api.js (Dynamic VITE_API_URL mapping)
│   │   └── utils/       # storage, financeMetrics
├── backend/              # Node.js + Express API
│   ├── routes/          # /api/ai, /api/transaction, /api/user
│   ├── services/        # aiService, transactionService
│   └── config/          # Firebase Admin initialization
```

## ⚙️ Setup & Installation

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# PORT=5005
# OPENAI_API_KEY=your_key
# FIREBASE_SERVICE_ACCOUNT_PATH=path/to/your/firebase-adminsdk.json
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Create a .env file with your Firebase config:
# VITE_API_URL=http://localhost:5005
# VITE_FIREBASE_API_KEY=...
# ...
npm run dev
```

## Security Guardrails

This repository includes a secret scanner that blocks known key formats
before commit and in CI.

Enable the local pre-commit hook once per clone:

```bash
git config core.hooksPath .githooks
```

## 🛡️ Security & Privacy
- **Environment Isolation**: All API keys and service accounts are excluded via `.gitignore`.
- **JWT Protection**: All `/api/*` routes are secured using Firebase ID Tokens.
- **Encryption**: Data is validated and normalized before cloud commit.

## 📝 License
This project is licensed under the MIT License.
