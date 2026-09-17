// Initialises Firebase and exports the auth + db singletons.
// All other modules import from here — never call initializeApp elsewhere.

import { CONFIG } from './config.js';

firebase.initializeApp(CONFIG.firebase);

export const auth = firebase.auth();
export const db   = firebase.firestore();
