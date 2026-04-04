@echo off
echo ===========================================
echo FULL STACK APP BUILDER
echo ===========================================
echo NOTE: Ensure you have Node.js installed.
echo Press any key to start installing dependencies.
pause

cd frontend
echo Installing Frontend Dependencies...
call npm install
cd ..

cd backend
echo Installing Backend Dependencies...
call npm install
cd ..

echo ===========================================
echo DONE.
echo To run:
echo 1. Edit backend/.env with your OpenAI API Key
echo 2. Run 'npm run dev' inside backend/
echo 3. Run 'npm run dev' inside frontend/
echo ===========================================
pause
