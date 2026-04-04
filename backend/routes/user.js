const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// GET user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // Create default profile from auth if missing
      const defaultProfile = {
        name: req.user.name || 'New User',
        email: req.user.email || '',
        phone: '',
        avatar: req.user.picture || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.collection('users').doc(uid).set({ profile: defaultProfile }, { merge: true });
      return res.json(defaultProfile);
    }

    const data = userDoc.data();
    if (!data.profile) {
       const defaultProfile = {
        name: req.user.name || 'New User',
        email: req.user.email || '',
        phone: '',
        avatar: req.user.picture || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.collection('users').doc(uid).update({ profile: defaultProfile });
      return res.json(defaultProfile);
    }

    res.json(data.profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE user profile
router.put('/profile/update', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, phone, avatar } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updateData = {
      'profile.name': name,
      'profile.phone': phone || '',
      'profile.avatar': avatar || '',
      'profile.updatedAt': new Date().toISOString()
    };

    await db.collection('users').doc(uid).update(updateData);
    
    // Fetch updated profile to return
    const updatedDoc = await db.collection('users').doc(uid).get();
    res.json(updatedDoc.data().profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE ALL DATA (Moved here)
router.delete('/delete-all', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    if (!db) return res.status(400).json({ error: 'Cloud database not available.' });

    const userRef = db.collection('users').doc(uid);
    
    // 1. Delete all transactions in the subcollection
    const txSnapshot = await userRef.collection('transactions').get();
    const batch = db.batch();
    txSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 2. Delete the user document itself (including balances and profile)
    batch.delete(userRef);
    
    await batch.commit();

    res.json({ success: true, message: 'All cloud data and profile deleted successfully.' });
  } catch (error) {
    console.error('Delete All Data Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE AI CHAT
router.delete('/delete-chat', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    if (!db) return res.status(400).json({ error: 'Cloud database not available.' });

    const userRef = db.collection('users').doc(uid);
    const chatsSnapshot = await userRef.collection('chats').get();
    
    if (chatsSnapshot.empty) {
      return res.json({ success: true, message: 'No chat history to delete.' });
    }

    const batch = db.batch();
    chatsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    res.json({ success: true, message: 'All AI chat messages deleted successfully.' });
  } catch (error) {
    console.error('Delete AI Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
