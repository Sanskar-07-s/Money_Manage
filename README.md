# AI Personal Finance App (Money Manage)

A premium, full-stack personal finance SaaS built with AI-powered transaction parsing, real-time analytics, and secure cloud synchronization. This application provides a modern, "glassmorphism" aesthetic and an industrial-grade interface for managing personal ledgers and financial health.

## ✨ Key Features
- **💬 AI Chat-Based Tracking**: Natural language processing for expense and income entry. Simply tell the assistant: "Spent $45 on dinner yesterday" and it will categorize and save the entry.
- **📊 Advanced Dashboard Analytics**: Real-time 7-day cash flow trends, category breakdowns, and financial health insights using Recharts.
- **📈 Professional Graph Sharing**: Export and share high-quality report images with built-in `html2canvas` and Web Share API support.
- **🔐 Firebase Authentication**: Secure user login, signup, and profile persistence via Firebase Auth and Firestore.
- **☁️ Hybrid Sync Architecture**: Intelligent local caching with high-latency cloud synchronization for offline-first capabilities.
- **🛡️ Identity Center**: Comprehensive profile management with secure node-based sign-out and session tracking.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Framer Motion (for animations), Tailwind CSS, Recharts, Three.js (3D Visuals).
- **Backend**: Node.js, Express, Axios.
- **Database**: Google Cloud Firestore.
- **AI Engine**: OpenAI GPT models for financial parsing and spend insights.

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- Firebase Account
- OpenAI API Key

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5005
OPENAI_API_KEY=your_openai_key
FIREBASE_SERVICE_ACCOUNT_PATH=./path-to-your-firebase-sdk.json
```
Run the backend:
```bash
node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5005
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
Run the frontend:
```bash
npm run dev
```

## 🔐 Environment Variables Summary
| Variable | Description |
| :--- | :--- |
| `OPENAI_API_KEY` | Required for AI chat parsing and financial insights. |
| `FIREBASE_CONFIG` | Full set of client keys for frontend Firebase Auth. |
| `FIREBASE_SERVICE_ACCOUNT` | JSON key for backend Firestore Admin operations. |

## 🚀 How to Push to GitHub
1. Create a new repository on GitHub.
2. Initialize local git and push:
```bash
git init
git add .
git commit -m "Initial commit: AI-powered Finance SaaS Modernization"
git remote add origin https://github.com/your-username/money-manage.git
git branch -M main
git push -u origin main
```

## 💎 Future Roadmap
- [ ] Integration with Plaid/Bank APIs for automatic transaction fetching.
- [ ] Multi-currency support with real-time exchange rate calculation.
- [ ] Advanced predictive AI for future spending forecasts.
- [ ] Dark mode customization and theming system.

---
## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
