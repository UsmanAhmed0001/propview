import { db } from './firebase.js';

const COL = 'properties';

/**
 * Subscribe to the properties collection.
 * Admins receive all documents; landlords receive only their own.
 * Returns the unsubscribe function.
 */
export function subscribe(isAdmin, uid, onChange) {
  let query = db.collection(COL);
  if (!isAdmin) query = query.where('landlordUid', '==', uid);

  return query.onSnapshot(snap => {
    const props = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort newest first client-side (avoids needing a composite Firestore index)
    props.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    onChange(props);
  });
}

/** Add a new property document. */
export const addProperty = data =>
  db.collection(COL).add({ ...data, createdAt: new Date().toISOString() });

/** Update an existing property document. */
export const updateProperty = (id, data) =>
  db.collection(COL).doc(id).update({ ...data, updatedAt: new Date().toISOString() });

/** Permanently delete a property document. */
export const deleteProperty = id =>
  db.collection(COL).doc(id).delete();
