/*
 * Found It — Campus Lost & Found
 * App logic: state, rendering, filters, and the report/detail drawers.
 * Data is kept in localStorage on the visitor's own device — there is no backend.
 */

/* ---------------- Icon set (inline SVG, no external deps) ---------------- */
const ICONS = {
  "ID Card": '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="{c}" stroke-width="1.6"/><circle cx="8" cy="12" r="2" stroke="{c}" stroke-width="1.6"/><path d="M13 10h6M13 14h4" stroke="{c}" stroke-width="1.6" stroke-linecap="round"/></svg>',
  "Wallet": '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="13" rx="2" stroke="{c}" stroke-width="1.6"/><path d="M2 10h20" stroke="{c}" stroke-width="1.6"/><circle cx="17" cy="14" r="1.4" fill="{c}"/></svg>',
  "Keys": '<svg viewBox="0 0 24 24" fill="none"><circle cx="7" cy="8" r="4" stroke="{c}" stroke-width="1.6"/><path d="M10.5 10.5L20 20M16 16l2.5-2.5M18.5 18.5L21 16" stroke="{c}" stroke-width="1.6" stroke-linecap="round"/></svg>',
  "Earphones": '<svg viewBox="0 0 24 24" fill="none"><path d="M4 13v-2a8 8 0 0116 0v2" stroke="{c}" stroke-width="1.6" stroke-linecap="round"/><rect x="2" y="13" width="5" height="7" rx="2" stroke="{c}" stroke-width="1.6"/><rect x="17" y="13" width="5" height="7" rx="2" stroke="{c}" stroke-width="1.6"/></svg>',
  "Book / Notes": '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v18H6.5A2.5 2.5 0 014 17.5v-13z" stroke="{c}" stroke-width="1.6"/><path d="M8 7h8M8 11h8" stroke="{c}" stroke-width="1.4" stroke-linecap="round"/></svg>',
  "Electronics": '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="{c}" stroke-width="1.6"/><path d="M9 18h6" stroke="{c}" stroke-width="1.6" stroke-linecap="round"/></svg>',
  "Bag": '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="13" rx="2" stroke="{c}" stroke-width="1.6"/><path d="M8 8V6a4 4 0 018 0v2" stroke="{c}" stroke-width="1.6"/></svg>',
  "Other": '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="{c}" stroke-width="1.6"/><path d="M12 7v6l4 2" stroke="{c}" stroke-width="1.6" stroke-linecap="round"/></svg>'
};
function iconFor(category, color){
  const svg = ICONS[category] || ICONS["Other"];
  return svg.replaceAll("{c}", color);
}

/* ---------------- State ---------------- */
const STORAGE_KEY = 'foundit_items_v1';
const HOUR = 3600000;

const seedItems = [
  { id: cryptoId(), name: "Student ID Card", category: "ID Card", status: "found", location: "Near the Library entrance", desc: "Found face-down near the turnstiles, photo shows a girl with glasses.", reporter: "Karthik M.", phone: "98765 43210", createdAt: Date.now() - 2*HOUR, photo:null },
  { id: cryptoId(), name: "Brown leather wallet", category: "Wallet", status: "found", location: "Canteen, table near the window", desc: "Contains a bus pass and a few cards, no cash visible.", reporter: "Divya S.", phone: "91234 56789", createdAt: Date.now() - 5*HOUR, photo:null },
  { id: cryptoId(), name: "Bunch of keys with a red keychain", category: "Keys", status: "lost", location: "Block C corridor, 2nd floor", desc: "Four keys and a small red elephant keychain.", reporter: "Rahul V.", phone: "99887 76655", createdAt: Date.now() - 24*HOUR, photo:null },
  { id: cryptoId(), name: "White wired earphones", category: "Earphones", status: "lost", location: "Basketball court", desc: "Apple-style wired earphones, slightly tangled, in a black pouch.", reporter: "Ananya K.", phone: "90000 11223", createdAt: Date.now() - 26*HOUR, photo:null },
  { id: cryptoId(), name: "Data Structures textbook", category: "Book / Notes", status: "found", location: "Room 204, left on a desk", desc: "Has 'Priya' written inside the front cover.", reporter: "Faculty desk", phone: "04422 334455", createdAt: Date.now() - 48*HOUR, photo:null },
  { id: cryptoId(), name: "Blue analog wristwatch", category: "Other", status: "returned", location: "Sports ground", desc: "Reunited with its owner on the same evening.", reporter: "Suresh P.", phone: "93333 44556", createdAt: Date.now() - 72*HOUR, photo:null },
];

function loadItems(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed) && parsed.length) return parsed;
    }
  }catch(e){ /* fall through to seed data */ }
  return seedItems;
}
function saveItems(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }catch(e){ /* storage unavailable, continue in-memory */ }
}

let items = loadItems();

let activeStatus = "all";
let searchTerm = "";
let activeCategory = "all";
let activeSort = "newest";
let pendingLostFound = "lost";
let pendingPhotoData = null;

function cryptoId(){ return 'i' + Math.random().toString(36).slice(2,10); }

function timeAgo(ts){
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if(min < 1) return 'Just now';
  if(min < 60) return min + (min === 1 ? ' minute ago' : ' minutes ago');
  const hrs = Math.floor(min / 60);
  if(hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
  const days = Math.floor(hrs / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}

/* ---------------- Rendering ---------------- */
const grid = document.getElementById('itemGrid');
const emptyState = document.getElementById('emptyState');
const resultCount = document.getElementById('resultCount');
const categoryFilter = document.getElementById('categoryFilter');

function populateCategories(){
  const cats = Object.keys(ICONS);
  categoryFilter.innerHTML = '<option value="all">All categories</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}
populateCategories();

function statusMeta(status){
  if(status === 'lost') return {label:'Lost', cls:'status-lost', bg:'#fce7df', ic:'#e4572e'};
  if(status === 'found') return {label:'Found', cls:'status-found', bg:'#dcf6ef', ic:'#028090'};
  return {label:'Returned', cls:'status-returned', bg:'#eef2f1', ic:'#5c7b7e'};
}

function renderChipCounts(){
  document.querySelectorAll('#statusChips .chip').forEach(chip => {
    const status = chip.dataset.status;
    const n = status === 'all' ? items.length : items.filter(i => i.status === status).length;
    const label = chip.textContent.replace(/\s*\(\d+\)$/, '').trim();
    chip.innerHTML = `${label} <span class="count">(${n})</span>`;
  });
}

function renderGrid(){
  const q = searchTerm.trim().toLowerCase();
  let filtered = items.filter(it => {
    if(activeStatus !== 'all' && it.status !== activeStatus) return false;
    if(activeCategory !== 'all' && it.category !== activeCategory) return false;
    if(q && !(it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || it.location.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))) return false;
    return true;
  });

  if(activeSort === 'newest') filtered = filtered.slice().sort((a,b) => b.createdAt - a.createdAt);
  else if(activeSort === 'oldest') filtered = filtered.slice().sort((a,b) => a.createdAt - b.createdAt);
  else if(activeSort === 'az') filtered = filtered.slice().sort((a,b) => a.name.localeCompare(b.name));

  resultCount.textContent = filtered.length + (filtered.length === 1 ? ' item' : ' items');
  grid.innerHTML = '';
  renderChipCounts();

  if(filtered.length === 0){
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  filtered.forEach(it => {
    const meta = statusMeta(it.status);
    const card = document.createElement('div');
    card.className = 'card' + (it.status === 'returned' ? ' returned' : '');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${it.name}`);
    card.innerHTML = `
      <div class="card-photo" style="background:${meta.bg}">
        <span class="status-pill ${meta.cls}">${meta.label}</span>
        ${it.photo ? `<img src="${it.photo}">` : iconFor(it.category, meta.ic)}
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(it.name)}</div>
        <div class="card-meta">📍 ${escapeHtml(it.location)}</div>
        <div class="card-meta">🕒 ${timeAgo(it.createdAt)}</div>
      </div>
    `;
    card.addEventListener('click', () => openDetail(it.id));
    card.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openDetail(it.id); }
    });
    grid.appendChild(card);
  });
}

/* Keep relative timestamps ("3 minutes ago") accurate as time passes */
setInterval(renderGrid, 60000);

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function renderStats(){
  const active = items.filter(i => i.status !== 'returned').length;
  const returned = items.filter(i => i.status === 'returned').length;
  const found = items.filter(i => i.status === 'found').length;
  document.getElementById('statRow').innerHTML = `
    <div class="stat"><div class="num">${active}</div><div class="label">Active posts</div></div>
    <div class="stat"><div class="num">${found}</div><div class="label">Items found, awaiting owner</div></div>
    <div class="stat"><div class="num">${returned}</div><div class="label">Reunited with owners</div></div>
  `;
}

/* ---------------- Filters ---------------- */
document.getElementById('searchInput').addEventListener('input', e => {
  searchTerm = e.target.value; renderGrid();
});
categoryFilter.addEventListener('change', e => {
  activeCategory = e.target.value; renderGrid();
});
document.getElementById('sortFilter').addEventListener('change', e => {
  activeSort = e.target.value; renderGrid();
});
document.getElementById('statusChips').addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if(!btn) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  activeStatus = btn.dataset.status;
  renderGrid();
});

document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if(e.key === '/' && !typing){
    e.preventDefault();
    document.getElementById('searchInput').focus();
  } else if(e.key === 'Escape'){
    closeDrawers();
  }
});

/* ---------------- Drawers ---------------- */
const scrim = document.getElementById('scrim');
const reportDrawer = document.getElementById('reportDrawer');
const detailDrawer = document.getElementById('detailDrawer');

function openDrawer(drawer){
  scrim.classList.add('open');
  drawer.classList.add('open');
}
function closeDrawers(){
  scrim.classList.remove('open');
  reportDrawer.classList.remove('open');
  detailDrawer.classList.remove('open');
}
scrim.addEventListener('click', closeDrawers);
document.getElementById('closeReport').addEventListener('click', closeDrawers);
document.getElementById('cancelReport').addEventListener('click', closeDrawers);
document.getElementById('closeDetail').addEventListener('click', closeDrawers);

/* ---- Report drawer ---- */
document.getElementById('openReportBtn').addEventListener('click', () => {
  resetReportForm();
  openDrawer(reportDrawer);
});

const optLost = document.getElementById('optLost');
const optFound = document.getElementById('optFound');
const locationLabel = document.getElementById('locationLabel');

function setLostFound(val){
  pendingLostFound = val;
  optLost.classList.toggle('active-lost', val === 'lost');
  optFound.classList.toggle('active-found', val === 'found');
  locationLabel.textContent = val === 'lost' ? 'Where it was lost' : 'Where it was found';
}
optLost.addEventListener('click', () => setLostFound('lost'));
optFound.addEventListener('click', () => setLostFound('found'));

const photoDrop = document.getElementById('photoDrop');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
photoDrop.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', () => loadPhotoFile(photoInput.files[0]));

function loadPhotoFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    pendingPhotoData = e.target.result;
    photoPreview.src = pendingPhotoData;
    photoPreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}
['dragover','dragenter'].forEach(evt => photoDrop.addEventListener(evt, e => {
  e.preventDefault();
  photoDrop.style.borderColor = 'var(--teal-500)';
}));
['dragleave','drop'].forEach(evt => photoDrop.addEventListener(evt, e => {
  e.preventDefault();
  photoDrop.style.borderColor = '';
}));
photoDrop.addEventListener('drop', e => {
  loadPhotoFile(e.dataTransfer.files[0]);
});

function resetReportForm(){
  setLostFound('lost');
  pendingPhotoData = null;
  photoPreview.style.display = 'none';
  photoPreview.src = '';
  document.getElementById('itemName').value = '';
  document.getElementById('itemCategory').selectedIndex = 0;
  document.getElementById('itemDesc').value = '';
  document.getElementById('itemLocation').value = '';
  document.getElementById('reporterName').value = '';
  document.getElementById('reporterPhone').value = '';
  document.querySelectorAll('#reportDrawer .field.invalid').forEach(f => f.classList.remove('invalid'));
}

function setFieldValid(fieldId, ok){
  document.getElementById(fieldId).classList.toggle('invalid', !ok);
}

/* Clear a field's error state as soon as the person starts fixing it */
[['fieldItemName','itemName'], ['fieldItemLocation','itemLocation'], ['fieldReporterName','reporterName'], ['fieldReporterPhone','reporterPhone']]
  .forEach(([fieldId, inputId]) => {
    document.getElementById(inputId).addEventListener('input', () => setFieldValid(fieldId, true));
  });

document.getElementById('submitReport').addEventListener('click', () => {
  const name = document.getElementById('itemName').value.trim();
  const location = document.getElementById('itemLocation').value.trim();
  const reporter = document.getElementById('reporterName').value.trim();
  const phone = document.getElementById('reporterPhone').value.trim();
  const phoneDigits = phone.replace(/\D/g, '');

  const nameOk = name.length > 0;
  const locationOk = location.length > 0;
  const reporterOk = reporter.length > 0;
  const phoneOk = phoneDigits.length >= 10;

  setFieldValid('fieldItemName', nameOk);
  setFieldValid('fieldItemLocation', locationOk);
  setFieldValid('fieldReporterName', reporterOk);
  setFieldValid('fieldReporterPhone', phoneOk);

  if(!nameOk || !locationOk || !reporterOk || !phoneOk){
    const firstInvalid = document.querySelector('.field.invalid input');
    if(firstInvalid) firstInvalid.focus();
    showToast('Check the highlighted fields below.');
    return;
  }

  const newItem = {
    id: cryptoId(),
    name,
    category: document.getElementById('itemCategory').value,
    status: pendingLostFound,
    location,
    desc: document.getElementById('itemDesc').value.trim() || 'No extra details added.',
    reporter,
    phone,
    createdAt: Date.now(),
    photo: pendingPhotoData
  };
  items.unshift(newItem);
  saveItems();
  closeDrawers();
  renderStats();
  renderGrid();
  showToast(pendingLostFound === 'lost' ? 'Item reported as lost. We\'ll show it to anyone searching.' : 'Nice work — item posted as found.');
});

/* ---- Detail drawer ---- */
function openDetail(id){
  const it = items.find(i => i.id === id);
  if(!it) return;
  const meta = statusMeta(it.status);

  document.getElementById('detailTitle').textContent = it.name;
  document.getElementById('detailBody').innerHTML = `
    <div class="detail-photo" style="background:${meta.bg}">
      ${it.photo ? `<img src="${it.photo}">` : iconFor(it.category, meta.ic)}
    </div>
    <span class="status-pill ${meta.cls}" style="position:static; display:inline-block; margin-bottom:14px;">${meta.label}</span>
    <div class="detail-row"><span>Category</span><span>${escapeHtml(it.category)}</span></div>
    <div class="detail-row"><span>Location</span><span>${escapeHtml(it.location)}</span></div>
    <div class="detail-row"><span>Posted</span><span>${timeAgo(it.createdAt)}</span></div>
    <div class="detail-row" style="border-bottom:none;"><span>Details</span><span style="text-align:right; max-width:220px;">${escapeHtml(it.desc)}</span></div>
    <div class="contact-reveal" id="contactBox" style="display:none;">
      <div class="cname">${escapeHtml(it.reporter)}</div>
      <div class="cway">📞 ${escapeHtml(it.phone)} <button class="copy-btn" id="copyPhoneBtn">Copy</button></div>
    </div>
  `;

  const copyBtn = document.getElementById('copyPhoneBtn');
  if(copyBtn){
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(it.phone).then(() => {
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      }).catch(() => showToast('Could not copy — number is ' + it.phone));
    });
  }

  const footer = document.getElementById('detailFooter');
  footer.innerHTML = '';

  if(it.status !== 'returned'){
    const contactBtn = document.createElement('button');
    contactBtn.className = 'btn btn-ghost';
    contactBtn.style.flex = '1';
    contactBtn.textContent = it.status === 'lost' ? 'Contact reporter' : 'Contact finder';
    contactBtn.addEventListener('click', () => {
      document.getElementById('contactBox').style.display = 'block';
      contactBtn.textContent = 'Contact details shown below';
      contactBtn.disabled = true;
    });

    const returnBtn = document.createElement('button');
    returnBtn.className = 'btn btn-primary';
    returnBtn.style.flex = '2';
    returnBtn.textContent = 'Mark as returned';
    let confirming = false;
    returnBtn.addEventListener('click', () => {
      if(!confirming){
        confirming = true;
        returnBtn.textContent = 'Confirm — really returned?';
        returnBtn.classList.add('btn-confirm');
        setTimeout(() => { confirming = false; }, 4000);
        return;
      }
      it.status = 'returned';
      saveItems();
      closeDrawers();
      renderStats();
      renderGrid();
      showToast('Marked as returned. Glad it made it back!');
    });

    footer.appendChild(contactBtn);
    footer.appendChild(returnBtn);
  } else {
    const note = document.createElement('div');
    note.style.cssText = 'text-align:center; width:100%; color:var(--muted); font-size:13px; padding:6px 0;';
    note.textContent = 'This item has already been returned to its owner.';
    footer.appendChild(note);
  }

  openDrawer(detailDrawer);
}

/* ---------------- Toast ---------------- */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------------- Init ---------------- */
renderStats();
renderGrid();
