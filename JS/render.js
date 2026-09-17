const TYPE_LABELS = {
  flat: 'Flat', house: 'House', hmo: 'HMO', studio: 'Studio', commercial: 'Commercial',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatDate(s) {
  try { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return s; }
}

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ── Stats cards ───────────────────────────────────────────────────────────────

export function updateStats(props) {
  const tot = props.length;
  const occ = props.filter(p => p.status === 'occupied').length;
  const vac = props.filter(p => p.status === 'vacant').length;
  const rev = props
    .filter(p => p.status === 'occupied')
    .reduce((sum, p) => sum + Number(p.monthlyRent || 0), 0);
  const pct = tot > 0 ? Math.round((occ / tot) * 100) : 0;

  setText('s-tot',     tot);
  setText('s-tot-sub', `${tot} ${tot === 1 ? 'property' : 'properties'} in portfolio`);
  setText('s-occ',     occ);
  setText('s-pct',     `${pct}% occupancy rate`);
  setText('s-vac',     vac);
  setText('s-rev',     rev > 0 ? `£${rev.toLocaleString()}` : '£0');
}

// ── Sidebar badges ────────────────────────────────────────────────────────────

export function updateBadges(props) {
  const today = new Date();
  const in30  = new Date(); in30.setDate(today.getDate() + 30);

  setText('nc-all', props.length);
  setText('nc-occ', props.filter(p => p.status === 'occupied').length);
  setText('nc-vac', props.filter(p => p.status === 'vacant').length);
  setText('nc-exp', props.filter(p => {
    if (!p.leaseEndDate) return false;
    const d = new Date(p.leaseEndDate);
    return d >= today && d <= in30;
  }).length);
}

// ── Properties table ──────────────────────────────────────────────────────────

/**
 * Render filtered property rows into #tbody.
 * @param {Array}    props    - full property list
 * @param {Object}   opts
 *   view     - 'all' | 'occupied' | 'vacant' | 'expiring'
 *   typeF    - 'all' | 'flat' | 'house' | 'hmo' | 'studio' | 'commercial'
 *   query    - free-text search string
 *   isAdmin  - show edit/delete buttons and Landlord column when true
 *   onEdit   - fn(id) called when edit button clicked
 *   onDelete - fn(id) called when delete button clicked
 */
export function renderTable(props, { view, typeF, query, isAdmin, onEdit, onDelete }) {
  const today = new Date();
  const in30  = new Date(); in30.setDate(today.getDate() + 30);
  const q     = (query || '').toLowerCase().trim();

  const list = props.filter(p => {
    if (view === 'occupied' && p.status !== 'occupied') return false;
    if (view === 'vacant'   && p.status !== 'vacant')   return false;
    if (view === 'expiring') {
      if (!p.leaseEndDate) return false;
      const d = new Date(p.leaseEndDate);
      if (!(d >= today && d <= in30)) return false;
    }
    if (typeF !== 'all' && p.propertyType !== typeF) return false;
    if (q && ![(p.address || ''), (p.tenantName || ''), (p.landlordName || '')]
      .some(s => s.toLowerCase().includes(q))) return false;
    return true;
  });

  const tbody = document.getElementById('tbody');

  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9
                 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1
                 1 0 011 1v5m-4 0h4"/>
          </svg>
          <h3>No properties found</h3>
          <p>${isAdmin ? 'Click "Add Property" to get started.' : 'No properties match the current filters.'}</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const statusBadge =
      p.status === 'occupied' ? `<span class="badge b-green">Occupied</span>` :
      p.status === 'vacant'   ? `<span class="badge b-red">Vacant</span>`     :
                                `<span class="badge b-yellow">Maintenance</span>`;

    const typeBadge = `<span class="badge b-blue">${esc(TYPE_LABELS[p.propertyType] || p.propertyType || '—')}</span>`;

    let leaseEnd = '—', leaseWarn = '';
    if (p.leaseEndDate) {
      leaseEnd = formatDate(p.leaseEndDate);
      const d  = new Date(p.leaseEndDate);
      if      (d < today) leaseWarn = ` <span style="color:var(--red-tx)"    title="Expired">⚠️</span>`;
      else if (d <= in30) leaseWarn = ` <span style="color:var(--yellow-tx)" title="Expiring within 30 days">⏰</span>`;
    }

    const actionBtns = isAdmin ? `
      <div class="row-acts">
        <button class="ib edit-btn" data-id="${p.id}" title="Edit">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button class="ib del del-btn" data-id="${p.id}" title="Delete">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                     01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1
                     1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>` : '';

    const landlordCol = isAdmin ? `<td>${esc(p.landlordName || '—')}</td>` : '';

    return `
      <tr>
        <td>
          <div class="prop-addr">${esc(p.address || '—')}</div>
          ${p.bedrooms ? `<div class="prop-sub">${p.bedrooms} bed</div>` : ''}
        </td>
        <td>${typeBadge}</td>
        <td><span class="rent-val">£${Number(p.monthlyRent || 0).toLocaleString()}</span></td>
        <td>${statusBadge}</td>
        <td>
          ${esc(p.tenantName || '—')}
          ${p.tenantContact ? `<div class="prop-sub">${esc(p.tenantContact)}</div>` : ''}
        </td>
        <td>${leaseEnd}${leaseWarn}</td>
        ${landlordCol}
        <td>${actionBtns}</td>
      </tr>`;
  }).join('');

  // Attach row-level click handlers after HTML is in the DOM
  tbody.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => onEdit(btn.dataset.id)));

  tbody.querySelectorAll('.del-btn').forEach(btn =>
    btn.addEventListener('click', () => onDelete(btn.dataset.id)));
}
