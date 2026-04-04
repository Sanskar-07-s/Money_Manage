const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { parseTransactionInput, generateResponse, generateInsights, generateContextReply } = require('../services/aiService');
const { db } = require('../config/firebase');
const {
  cloneDefaultBalances,
  normalizeBalances,
  applyTransactionToBalances,
} = require('../services/transactionService');

router.get('/history', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    if (!db) return res.json({ messages: [] });

    const snapshot = await db.collection('users').doc(uid).collection('chats')
      .orderBy('createdAt', 'asc').limit(50).get();
    
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/process', verifyToken, async (req, res) => {
  try {
    const { message, localBalances } = req.body;
    const uid = req.user.uid;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Save User Message
    if (db) {
      await db.collection('users').doc(uid).collection('chats').add({
        text: message,
        sender: 'user',
        createdAt: new Date()
      });
    }

    const parsed = await parseTransactionInput(message);
    let updatedBalances = normalizeBalances(localBalances || cloneDefaultBalances());
    let transactions = [];

    if (db) {
      const userRef = db.collection('users').doc(uid);
      const doc = await userRef.get();

      if (doc.exists) {
        updatedBalances = normalizeBalances(doc.data().balances);
      }

      const snapshot = await userRef.collection('transactions').orderBy('createdAt', 'desc').limit(10).get();
      snapshot.forEach((txDoc) => transactions.push({ id: txDoc.id, ...txDoc.data() }));
    }

    let aiMessage = '';
    let responseObj = {};

    if (parsed.intent !== 'transaction') {
      aiMessage = await generateContextReply({
        message,
        intent: parsed.intent,
        focus: parsed.focus,
        balances: updatedBalances,
        transactions,
        cloudEnabled: Boolean(db),
      });

      responseObj = {
        aiMessage,
        updatedBalances,
        parsedIntent: parsed.intent,
        parsedFocus: parsed.focus || null,
      };
    } else {
      const parsedData = {
        ...parsed.transaction,
        createdAt: new Date().toISOString(),
        source: 'ai',
      };

      if (db) {
        const userRef = db.collection('users').doc(uid);
        updatedBalances = applyTransactionToBalances(updatedBalances, parsedData);

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

        await userRef.collection('transactions').add({
          ...parsedData,
          createdAt: new Date(),
        });
      } else {
        updatedBalances = applyTransactionToBalances(updatedBalances, parsedData);
      }

      aiMessage = await generateResponse(parsedData, updatedBalances);
      responseObj = {
        parsedTransaction: parsedData,
        parsedIntent: parsed.intent,
        aiMessage,
        updatedBalances
      };
    }

    // Save AI Message
    if (db) {
      await db.collection('users').doc(uid).collection('chats').add({
        text: aiMessage,
        sender: 'ai',
        createdAt: new Date()
      });
    }

    res.json(responseObj);

  } catch (error) {
    console.error('Core Process Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/insights', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    if (!db) {
      return res.json({ insight: 'Running in local mode. Connect Firebase to get synced AI insights.' });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.json({ insight: 'Not enough data yet.' });
    }

    const data = userDoc.data();
    const transactionsSnapshot = await userRef.collection('transactions').orderBy('createdAt', 'desc').limit(10).get();
    const transactions = [];
    transactionsSnapshot.forEach((doc) => transactions.push({ id: doc.id, ...doc.data() }));

    const insight = await generateInsights(data.balances, transactions);
    res.json({ insight });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
