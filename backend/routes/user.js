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

// --- CATEGORY MANAGEMENT ---

// GET user categories
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists || !userDoc.data().categories) {
       // Return default categories if none exist
       const defaultCategories = [
         { id: '1', name: 'Food', type: 'expense' },
         { id: '2', name: 'Travel', type: 'expense' },
         { id: '3', name: 'College', type: 'expense' },
         { id: '4', name: 'Freelancing', type: 'income' },
         { id: '5', name: 'Investment', type: 'expense' },
         { id: '6', name: 'Personal', type: 'expense' }
       ];
       return res.json(defaultCategories);
    }

    res.json(userDoc.data().categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// ADD category
router.post('/categories/add', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let categories = userDoc.exists && userDoc.data().categories ? userDoc.data().categories : [];

    // Check for duplicates
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const newCategory = {
      id: Date.now().toString(),
      name,
      type
    };

    categories.push(newCategory);
    await userRef.update({ categories });

    res.json(newCategory);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE category
router.put('/categories/update', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id, name, type } = req.body;

    if (!id || !name || !type) {
      return res.status(400).json({ error: 'ID, name, and type are required' });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let categories = userDoc.exists && userDoc.data().categories ? userDoc.data().categories : [];

    const index = categories.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check for duplicates (excluding current)
    if (categories.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    categories[index] = { ...categories[index], name, type };
    await userRef.update({ categories });

    res.json(categories[index]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE category
router.delete('/categories/delete/:id', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let categories = userDoc.exists && userDoc.data().categories ? userDoc.data().categories : [];

    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is used in transactions
    const txSnapshot = await userRef.collection('transactions')
      .where('category', '==', categoryToDelete.name)
      .limit(1)
      .get();

    if (!txSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Category is in use', 
        inUse: true,
        message: 'This category is used in existing transactions. Deleting it may cause inconsistency.' 
      });
    }

    const updatedCategories = categories.filter(c => c.id !== id);
    await userRef.update({ categories: updatedCategories });

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
