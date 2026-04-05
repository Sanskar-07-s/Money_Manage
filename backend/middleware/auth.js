const { admin, isFirebaseAdminReady, firebaseAdminError } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    if (!isFirebaseAdminReady) {
      return res.status(503).json({
        error: 'Authentication service unavailable',
        hint: 'Configure FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_PATH.',
        detail: firebaseAdminError ? firebaseAdminError.message : 'Firebase Admin SDK not initialized',
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { verifyToken };
