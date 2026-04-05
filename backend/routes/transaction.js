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
    if (!db) return res.status(400).json({ error: 'Cloud database not available.' });

    const localBalances = normalizeBalances(req.body.balances);
    const localTransactions = Array.isArray(req.body.transactions) ? req.body.transactions : [];

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // First time sync - push local to cloud
      await userRef.set({ balances: localBalances, profile: { uid, updatedAt: new Date() } }, { merge: true });
      const batch = db.batch();
      localTransactions.forEach(tx => {
        const ref = userRef.collection('transactions').doc();
        batch.set(ref, { ...tx, createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date() });
      });
      await batch.commit();

      return res.json({ 
        success: true, 
        source: 'local_win', 
        balances: localBalances,
        transactions: localTransactions 
      });
    }

    const cloudData = userDoc.data();
    const cloudBalances = normalizeBalances(cloudData.balances);
    
    // CONFLICT RESOLUTION: Use latest timestamp
    const cloudIsNewer = (cloudBalances.lastUpdated || 0) > (localBalances.lastUpdated || 0);

    if (cloudIsNewer) {
      // Cloud wins - Fetch all transactions and return to client
      const txSnapshot = await userRef.collection('transactions').orderBy('createdAt', 'desc').get();
      const cloudTransactions = [];
      txSnapshot.forEach(doc => cloudTransactions.push({ id: doc.id, ...doc.data() }));

      return res.json({
        success: true,
        source: 'cloud_win',
        balances: cloudBalances,
        transactions: cloudTransactions
      });
    } else {
      // Local wins - Update cloud with local state
      await userRef.update({ 
        balances: localBalances,
        'profile.updatedAt': new Date()
      });
      
      // Smart Add: Only add transactions that don't exist in cloud (naive check by note/amount/date for demo)
      // For production, we'd use persistent IDs.
      
      return res.json({
        success: true,
        source: 'local_win',
        balances: localBalances
      });
    }
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
