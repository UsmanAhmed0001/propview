import { auth }   from './firebase.js';
import { CONFIG } from './config.js';

/** True if the signed-in email matches the configured admin email. */
export const isAdminEmail = email =>
  email.toLowerCase() === CONFIG.adminEmail.toLowerCase();

/** Sign in with email + password. Throws on failure. */
export const signIn = (email, password) =>
  auth.signInWithEmailAndPassword(email, password);

/** Sign out the current user. */
export const signOut = () => auth.signOut();

/** Register a callback that fires whenever auth state changes. */
export const onAuthChange = cb => auth.onAuthStateChanged(cb);
