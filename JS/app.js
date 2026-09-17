// ─── Imports ─────────────────────────────────────────────────────────────────
import { isAdminEmail, signIn, signOut, onAuthChange } from './auth.js';
import { subscribe, addProperty, updateProperty, deleteProperty } from './properties.js';
import { getLandlords, createLandlord, deleteLandlord } from './users.js';
import { updateStats, updateBadges, renderTable, setText } from './render.js';
import {
  toast,
  showLogin, showApp,
  setLoginError, setLoginLoading, togglePasswordVisibility,
  openModal, closeModal,
  toggleTenantFields, clearPropertyForm, fillPropertyForm,
  readPropertyForm, populateLandlordDropdown,
  renderLandlordList,
} from './ui.js';

// ─── App state ────────────────────────────────────────────────────────────────
let props     = [];
let landlords = [];
let view      = 'all';
let typeF     = 'all';
let editId    = null;
let isAdmin   = false;
let unsubscribeProps = null;

// ─── Auth listener ────────────────────────────────────────────────────────────
onAuthChange(async user => {
  if (user) {
    isAdmin = isAdminEmail(user.email);
    setupUserUI(user);
    if (isAdmin) await fetchLandlords();
    startPropertySubscription(user.uid);
    showApp();
  } else {
    stopPropertySubscription();
    props = []; landlords = [];
    showLogin();
  }
});

// ─── User UI ──────────────────────────────────────────────────────────────────
function setupUserUI(user) {
  const initials = user.email.substring(0, 2).toUpperCase();
  const avatar   = document.getElementById('s-av');
  avatar.textContent = initials;
  if (isAdmin) avatar.classList.add('admin-av');
  else         avatar.classList.remove('admin-av');

  setText('s-uname', user.email);
  setText('s-urole', isAdmin ? '⚡ Administrator' : 'Landlord');

  document.getElementById('admin-nav').style.display = isAdmin ? 'block'        : 'none';
  document.getElementById('add-btn').style.display   = isAdmin ? 'inline-flex'  : 'none';
  document.getElementById('th-ll').style.display     = isAdmin ? ''             : 'none';
}

// ─── Property subscription ────────────────────────────────────────────────────
function startPropertySubscription(uid) {
  stopPropertySubscription();
  unsubscribeProps = subscribe(isAdmin, uid, data => {
    props = data;
    updateStats(props);
    updateBadges(props);
    renderProps();
  });
}

function stopPropertySubscription() {
  if (unsubscribeProps) { unsubscribeProps(); unsubscribeProps = null; }
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderProps() {
  renderTable(props, {
    view,
    typeF,
    query:    document.getElementById('q')?.value || '',
    isAdmin,
    onEdit:   id => handleOpenEdit(id),
    onDelete: id => handleDelete(id),
  });
}

// ─── Landlords ───────────────────────────────────────────────────────────────
async function fetchLandlords() {
  try   { landlords = await getLandlords(); }
  catch { landlords = []; }
}

// ─── View / type filters ──────────────────────────────────────────────────────
function handleSetView(v, el) {
  view = v;
  const labels = {
    all:      'All Properties',
    occupied: 'Occupied Properties',
    vacant:   'Vacant Properties',
    expiring: 'Expiring Soon',
  };
  setText('page-title', labels[v] || 'Properties');
  document.querySelectorAll('.s-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  renderProps();
}

function handleSetType(t, el) {
  typeF = t;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderProps();
}

// ─── Property modal ───────────────────────────────────────────────────────────
function handleOpenAdd() {
  editId = null;
  setText('pm-ttl', 'Add Property');
  document.getElementById('pm-save').textContent = 'Save Property';
  clearPropertyForm();
  populateLandlordDropdown(landlords, '');
  openModal('prop-modal');
}

function handleOpenEdit(id) {
  const prop = props.find(p => p.id === id);
  if (!prop) return;
  editId = id;
  setText('pm-ttl', 'Edit Property');
  document.getElementById('pm-save').textContent = 'Save Changes';
  fillPropertyForm(prop);
  populateLandlordDropdown(landlords, prop.landlordUid || '');
  openModal('prop-modal');
}

async function handleSaveProperty() {
  const data = readPropertyForm();
  if (!data.address || !data.propertyType || !data.monthlyRent || !data.status || !data.landlordUid) {
    toast('Please fill in all required fields (*)', 'err');
    return;
  }

  const btn = document.getElementById('pm-save');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    if (editId) {
      await updateProperty(editId, data);
      toast('Property updated ✓', 'ok');
    } else {
      await addProperty(data);
      toast('Property added ✓', 'ok');
    }
    closeModal('prop-modal');
    editId = null;
  } catch (err) {
    toast('Save failed: ' + (err.message || err), 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = editId ? 'Save Changes' : 'Save Property';
  }
}

async function handleDelete(id) {
  if (!confirm('Delete this property permanently? This cannot be undone.')) return;
  try {
    await deleteProperty(id);
    toast('Property deleted', 'ok');
  } catch (err) {
    toast('Delete failed: ' + err.message, 'err');
  }
}

// ─── Users modal ──────────────────────────────────────────────────────────────
async function handleOpenUsers() {
  await fetchLandlords();
  renderLandlordList(landlords, handleRemoveLandlord);
  openModal('users-modal');
}

async function handleCreateLandlord() {
  const name  = document.getElementById('nu-name').value.trim();
  const email = document.getElementById('nu-email').value.trim();
  const pw    = document.getElementById('nu-pw').value;
  const errEl = document.getElementById('nu-err');
  errEl.style.display = 'none';

  if (!name || !email || !pw) {
    errEl.textContent = 'All fields are required.';
    errEl.style.display = 'block';
    return;
  }
  if (pw.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('nu-btn');
  btn.disabled = true;
  btn.textContent = 'Creating…';

  try {
    const newLandlord = await createLandlord(name, email, pw);
    landlords.push(newLandlord);
    renderLandlordList(landlords, handleRemoveLandlord);
    populateLandlordDropdown(landlords, '');
    ['nu-name', 'nu-email', 'nu-pw'].forEach(id => document.getElementById(id).value = '');
    toast(`Account created for ${name} ✓`, 'ok');
  } catch (err) {
    const messages = {
      'auth/email-already-in-use': 'That email is already registered.',
      'auth/invalid-email':        'Invalid email address.',
      'auth/weak-password':        'Password too weak (min 6 characters).',
    };
    errEl.textContent  = messages[err.code] || err.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Create Account';
  }
}

async function handleRemoveLandlord(uid, name) {
  if (!confirm(`Remove ${name}? They will no longer be able to log in.`)) return;
  try {
    await deleteLandlord(uid);
    landlords = landlords.filter(l => l.uid !== uid);
    renderLandlordList(landlords, handleRemoveLandlord);
    toast(`${name} removed`, 'ok');
  } catch (err) {
    toast('Remove failed: ' + err.message, 'err');
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pw    = document.getElementById('l-pw').value;
  if (!email || !pw) { setLoginError('Please enter your email and password.'); return; }

  setLoginLoading(true);
  setLoginError('');

  try {
    await signIn(email, pw);
    // onAuthChange takes over from here
  } catch (err) {
    setLoginLoading(false);
    const messages = {
      'auth/user-not-found':     'No account found with that email.',
      'auth/wrong-password':     'Incorrect password.',
      'auth/invalid-email':      'Invalid email address.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests':  'Too many failed attempts. Please try again later.',
    };
    setLoginError(messages[err.code] || err.message);
  }
}

// ─── Event listeners (set up once DOM is ready) ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Login
  document.getElementById('l-btn')?.addEventListener('click', handleLogin);
  document.getElementById('l-pw')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('l-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('l-pw').focus(); });
  document.getElementById('pw-toggle')?.addEventListener('click', togglePasswordVisibility);

  // Sidebar nav views
  document.querySelectorAll('.s-item[data-view]').forEach(el =>
    el.addEventListener('click', () => handleSetView(el.dataset.view, el)));

  // Type chips
  document.querySelectorAll('.chip[data-type]').forEach(el =>
    el.addEventListener('click', () => handleSetType(el.dataset.type, el)));

  // Topbar
  document.getElementById('add-btn')?.addEventListener('click', handleOpenAdd);
  document.getElementById('q')?.addEventListener('input', renderProps);

  // Sidebar admin actions
  document.getElementById('sidebar-add')?.addEventListener('click', handleOpenAdd);
  document.getElementById('sidebar-users')?.addEventListener('click', handleOpenUsers);
  document.getElementById('logout-btn')?.addEventListener('click', signOut);

  // Property modal
  document.getElementById('pm-save')?.addEventListener('click', handleSaveProperty);
  document.getElementById('pm-close')?.addEventListener('click', () => closeModal('prop-modal'));
  document.getElementById('pm-cancel')?.addEventListener('click', () => closeModal('prop-modal'));
  document.getElementById('prop-modal')?.addEventListener('click', e => {
    if (e.target.id === 'prop-modal') closeModal('prop-modal');
  });
  document.getElementById('f-status')?.addEventListener('change', toggleTenantFields);

  // Users modal
  document.getElementById('nu-btn')?.addEventListener('click', handleCreateLandlord);
  document.getElementById('um-close')?.addEventListener('click', () => closeModal('users-modal'));
  document.getElementById('um-cancel')?.addEventListener('click', () => closeModal('users-modal'));
  document.getElementById('users-modal')?.addEventListener('click', e => {
    if (e.target.id === 'users-modal') closeModal('users-modal');
  });

  // Keyboard shortcut
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal('prop-modal'); closeModal('users-modal'); }
  });
});
