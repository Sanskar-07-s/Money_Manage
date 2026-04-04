const express = require('express');
const cors = require('cors');
require('dotenv').config();

const aiRoutes = require('./routes/ai');
const transactionRoutes = require('./routes/transaction');
const userRoutes = require('./routes/user');

const app = express();
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/ai', aiRoutes);
app.use('/transaction', transactionRoutes);
app.use('/user', userRoutes);

app.get('/', (req, res) => {
  res.send('Money Manage Backend Running');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
