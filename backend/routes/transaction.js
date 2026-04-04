const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const {
  cloneDefaultBalances,
  normalizeBalances,
  applyTransactionToBalances,
} = require('../services/transactionService');

router.post('/add', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const transaction = {
      ...req.body,
      type: req.body.type === 'income' ? 'income' : 'expense',
      amount: Number(req.body.amount) || 0,
      category: req.body.category || 'Personal',
      account: req.body.account || 'Cash',
      note: req.body.note || 'Manual transaction',
      source: req.body.source || 'manual',
    };

    if (!db) {
      return res.json({
        success: true,
        transaction,
        updatedBalances: applyTransactionToBalances(cloneDefaultBalances(), transaction),
      });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const currentBalances = userDoc.exists ? userDoc.data().balances : cloneDefaultBalances();
    const updatedBalances = applyTransactionToBalances(currentBalances, transaction);

    await userRef.set(
      {
        balances: updatedBalances,
        profile: {
          uid,
          updatedAt: new Date(),
        },
      },
      { merge: true }
    );

    const savedTransaction = {
      ...transaction,
      createdAt: new Date(),
    };

    const docRef = await userRef.collection('transactions').add(savedTransaction);

    res.json({
      success: true,
      transaction: { id: docRef.id, ...savedTransaction },
      updatedBalances,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    if (!db) {
      return res.json({ transactions: [] });
    }

    const userRef = db.collection('users').doc(uid);
    const snapshot = await userRef.collection('transactions').orderBy('createdAt', 'desc').get();

    const txs = [];
    snapshot.forEach((doc) => {
      txs.push({ id: doc.id, ...doc.data() });
    });

    res.json({ transactions: txs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    if (!db) {
      return res.json({ balances: cloneDefaultBalances() });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const balances = userDoc.exists ? normalizeBalances(userDoc.data().balances) : cloneDefaultBalances();

    res.json({ balances });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    if (!db) {
      return res.json({
        cloudAvailable: false,
        userId: uid,
        transactionCount: 0,
      });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const txSnapshot = await userRef.collection('transactions').limit(1).get();

    res.json({
      cloudAvailable: true,
      userId: uid,
      hasProfile: userDoc.exists,
      transactionCount: txSnapshot.size,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const balances = normalizeBalances(req.body?.balances || cloneDefaultBalances());
    const transactions = Array.isArray(req.body?.transactions) ? req.body.transactions : [];

    if (!db) {
      return res.status(400).json({ error: 'Cloud database is not configured on the backend.' });
    }

    const userRef = db.collection('users').doc(uid);
    const existingSnapshot = await userRef.collection('transactions').get();

    if (existingSnapshot.empty) {
      for (const tx of transactions) {
        const normalizedTransaction = {
          type: tx.type === 'income' ? 'income' : 'expense',
          amount: Number(tx.amount) || 0,
          category: tx.category || 'Personal',
          account: tx.account || 'Cash',
          note: tx.note || 'Synced transaction',
          source: tx.source || 'sync',
          createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
        };

        await userRef.collection('transactions').add(normalizedTransaction);
      }
    }

    await userRef.set(
      {
        balances,
        profile: {
          uid,
          updatedAt: new Date(),
        },
      },
      { merge: true }
    );

    res.json({
      success: true,
      syncedTransactions: existingSnapshot.empty ? transactions.length : 0,
      balances,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
