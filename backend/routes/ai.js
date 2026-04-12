const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { 
  parseTransactionInput, 
  generateResponse, 
  generateInsights, 
  generateContextReply, 
  suggestCategory, 
  generatePersonalityReport, 
  suggestBudgets 
} = require('../services/aiService');
const { db } = require('../config/firebase');
const {
  cloneDefaultBalances,
  normalizeBalances,
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

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let customCategories = [];
    if (userDoc.exists && userDoc.data().categories) {
       customCategories = userDoc.data().categories;
    }

    // 1. Log User Message
    if (db) {
      await userRef.collection('chats').add({
        text: message,
        sender: 'user',
        createdAt: new Date()
      });
    }

    // 2. Parse into Planning Format
    const plan = await parseTransactionInput(message, customCategories);
    
    let updatedBalances = normalizeBalances(localBalances || cloneDefaultBalances());
    let transactions = [];

    if (db && userDoc.exists) {
      updatedBalances = normalizeBalances(userDoc.data().balances || cloneDefaultBalances());
      const snapshot = await userRef.collection('transactions').orderBy('createdAt', 'desc').limit(10).get();
      snapshot.forEach((txDoc) => transactions.push({ id: txDoc.id, ...txDoc.data() }));
    }

    // 3. Generate textual context if no primary action
    let aiMessage = plan.message;
    if (plan.actions.length === 0) {
       aiMessage = await generateContextReply({
         message,
         intent: plan.intent,
         balances: updatedBalances,
         transactions,
         cloudEnabled: Boolean(db),
       });
    }

    const responseObj = {
      message: aiMessage,
      actions: plan.actions,
      confidence: plan.confidence,
      requiresApproval: plan.requiresApproval,
      intent: plan.intent
    };

    // 4. Log AI Response
    if (db) {
       await userRef.collection('chats').add({
         text: aiMessage,
         sender: 'ai',
         actions: plan.actions,
         requiresApproval: plan.requiresApproval,
         createdAt: new Date()
       });
    }

    res.json(responseObj);
  } catch (error) {
    console.error('[AI-Process] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/log-event', verifyToken, async (req, res) => {
  try {
    const { eventType, oldData, newData } = req.body;
    const uid = req.user.uid;
    const userRef = db.collection('users').doc(uid);

    const eventMsg = `[System Event: ${eventType}] User manually modified data.`;
    
    if (db) {
      await userRef.collection('chats').add({
        text: eventMsg,
        sender: 'system',
        eventType,
        oldData,
        newData,
        createdAt: new Date()
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/report', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    if (!db) return res.status(400).json({ error: 'Cloud data required for reports.' });
    const userRef = db.collection('users').doc(uid);
    const txSnapshot = await userRef.collection('transactions').orderBy('createdAt', 'desc').limit(50).get();
    if (txSnapshot.empty) return res.json({ personalityType: "New User", insights: "Start logging transactions." });
    const txs = [];
    txSnapshot.forEach(doc => txs.push(doc.data()));
    const report = await generatePersonalityReport(txs);
    await userRef.collection('reports').add({ ...report, month: new Date().toISOString().slice(0, 7), createdAt: new Date() });
    res.json(report);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/suggest-budgets', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userRef = db.collection('users').doc(uid);
    const txSnapshot = await userRef.collection('transactions').limit(100).get();
    const txs = [];
    txSnapshot.forEach(doc => txs.push(doc.data()));
    const suggestions = await suggestBudgets(txs);
    res.json(suggestions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/update-budgets', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { budgets } = req.body;
    if (!db) return res.json({ success: true });
    const userRef = db.collection('users').doc(uid);
    await userRef.set({ budgetGoals: budgets }, { merge: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
