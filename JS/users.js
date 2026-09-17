import { db }     from './firebase.js';
import { CONFIG } from './config.js';

/** Fetch all landlord accounts from Firestore. */
export async function getLandlords() {
  const snap = await db.collection('users').where('role', '==', 'landlord').get();
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

/**
 * Create a new landlord Firebase Auth account + Firestore user record.
 * Uses a secondary Firebase app instance so the admin stays signed in.
 */
export async function createLandlord(name, email, password) {
  // Reuse secondary app if already initialised, otherwise create it
  let secondary;
  try   { secondary = firebase.app('reg'); }
  catch { secondary = firebase.initializeApp(CONFIG.firebase, 'reg'); }

  const sAuth = secondary.auth();
  try {
    const { user } = await sAuth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(user.uid).set({
      email,
      name,
      role: 'landlord',
      createdAt: new Date().toISOString(),
    });
    await sAuth.signOut();
    return { uid: user.uid, name, email };
  } catch (err) {
    await sAuth.signOut().catch(() => {});
    throw err;
  }
}

/** Delete a landlord's Firestore user record (does not delete their Auth account). */
export const deleteLandlord = uid =>
  db.collection('users').doc(uid).delete();
