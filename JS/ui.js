import { esc } from './render.js';

export function toast(message, type = 'ok') {
  const container = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast t-${type}`;
  const colour = type === 'ok' ? '#22c55e' : 'var(--red-tx)';
  el.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="width:15px;height:15px;flex-shrink:0;color:${colour}">${type === 'ok' ? '<path d="M5 13l4 4L19 7"/>' : '<path d="M6 18L18 6M6 6l12 12"/>'}</svg>${esc(message)}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
export function showLogin() {
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('app-view').style.display = 'none';
}
export function showApp() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('app-view').style.display = 'flex';
}
export function setLoginError(msg) {
  const el = document.getElementById('l-err');
  if (msg) { el.textContent = msg; el.style.display = 'block'; }
  else { el.textContent = ''; el.style.display = 'none'; }
}
export function setLoginLoading(loading) {
  const btn = document.getElementById('l-btn');
  if (loading) { btn.disabled = true; btn.innerHTML = '<span class="sp"></span>Signing in…'; }
  else { btn.disabled = false; btn.innerHTML = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg> Sign In'; }
}
export function togglePasswordVisibility() {
  const input = document.getElementById('l-pw');
  input.type = input.type === 'password' ? 'text' : 'password';
}
export function openModal(id) { document.getElementById(id).style.display = 'flex'; }
export function closeModal(id) { document.getElementById(id).style.display = 'none'; }
export function toggleTenantFields() {
  document.getElementById('tenant-block').style.display =
    document.getElementById('f-status').value === 'occupied' ? 'block' : 'none';
}
export function clearPropertyForm() {
  ['f-addr','f-type','f-beds','f-rent','f-ten','f-tcon','f-ls','f-le','f-notes']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('f-status').value = 'occupied';
  toggleTenantFields();
}
export function fillPropertyForm(prop) {
  document.getElementById('f-addr').value = prop.address || '';
  document.getElementById('f-type').value = prop.propertyType || '';
  document.getElementById('f-beds').value = prop.bedrooms || '';
  document.getElementById('f-rent').value = prop.monthlyRent || '';
  document.getElementById('f-status').value = prop.status || 'occupied';
  document.getElementById('f-ten').value = prop.tenantName || '';
  document.getElementById('f-tcon').value = prop.tenantContact || '';
  document.getElementById('f-ls').value = prop.leaseStartDate || '';
  document.getElementById('f-le').value = prop.leaseEndDate || '';
  document.getElementById('f-notes').value = prop.notes || '';
  toggleTenantFields();
}
export function readPropertyForm() {
  const llSelect = document.getElementById('f-ll');
  return {
    address: document.getElementById('f-addr').value.trim(),
    propertyType: document.getElementById('f-type').value,
    bedrooms: Number(document.getElementById('f-beds').value) || null,
    monthlyRent: Number(document.getElementById('f-rent').value),
    status: document.getElementById('f-status').value,
    tenantName: document.getElementById('f-ten').value.trim() || null,
    tenantContact: document.getElementById('f-tcon').value.trim() || null,
    leaseStartDate: document.getElementById('f-ls').value || null,
    leaseEndDate: document.getElementById('f-le').value || null,
    landlordUid: llSelect.value,
    landlordName: llSelect.selectedOptions[0]?.dataset.name || '',
    notes: document.getElementById('f-notes').value.trim() || null,
  };
}
export function populateLandlordDropdown(landlords, selectedUid = '') {
  const select = document.getElementById('f-ll');
  select.innerHTML = '<option value="">Select a landlord…</option>' +
    landlords.map(l => `<option value="${esc(l.uid)}" data-name="${esc(l.name)}"${l.uid === selectedUid ? ' selected' : ''}>${esc(l.name)} — ${esc(l.email)}</option>`).join('');
}
export function renderLandlordList(landlords, onRemove) {
  const container = document.getElementById('user-list');
  if (!landlords.length) { container.innerHTML = '<div class="user-empty">No landlord accounts yet.</div>'; return; }
  container.innerHTML = landlords.map(l => `
    <div class="user-row">
      <div class="user-av">${(l.name || l.email).charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${esc(l.name || '(no name)')}</div>
        <div class="user-email">${esc(l.email)}</div>
      </div>
      <button class="btn btn-danger rm-btn" data-uid="${l.uid}" data-name="${esc(l.name || l.email)}" style="padding:5px 10px;font-size:12px">Remove</button>
    </div>`).join('');
  container.querySelectorAll('.rm-btn').forEach(btn =>
    btn.addEventListener('click', () => onRemove(btn.dataset.uid, btn.dataset.name)));
}
