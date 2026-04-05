const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { isFirebaseAdminReady, firebaseAdminError } = require('./config/firebase');

const aiRoutes = require('./routes/ai');
const transactionRoutes = require('./routes/transaction');
const userRoutes = require('./routes/user');

const app = express();
app.use(cors());
app.use(express.json());

// Main API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/user', userRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'active',
    firebaseReady: isFirebaseAdminReady,
    firebaseError: firebaseAdminError ? firebaseAdminError.message : null,
    timestamp: new Date(),
  });
});

app.get('/', (req, res) => {
  res.send('Money Manage Backend Running');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
