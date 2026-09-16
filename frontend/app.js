const API_BASE = 'http://localhost:5000/api';

// ---------- Simple state helpers ----------
function getToken() { return localStorage.getItem('token'); }
function getRole() { return localStorage.getItem('role'); }
function getName() { return localStorage.getItem('name'); }
function getUserId() { return localStorage.getItem('userId'); }
function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('role', user.role);
  localStorage.setItem('name', user.name);
  localStorage.setItem('userId', user.id);
}
function clearSession() { localStorage.clear(); }

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ---------- Screen switching ----------
function hideAllScreens() {
  ['landingScreen', 'authScreen', 'donorScreen', 'ngoScreen', 'workerScreen', 'impactScreen', 'partnersScreen']
    .forEach(id => document.getElementById(id).classList.add('hidden'));
}

function showLanding() {
  hideAllScreens();
  document.getElementById('landingScreen').classList.remove('hidden');
  document.getElementById('topNav').classList.remove('hidden');
  document.getElementById('userBar').innerHTML = '';
}

function showAuth() {
  hideAllScreens();
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('topNav').classList.remove('hidden');
}

function showImpact() {
  hideAllScreens();
  document.getElementById('impactScreen').classList.remove('hidden');
  document.getElementById('topNav').classList.remove('hidden');
  loadImpactData();
}

function showPartners() {
  hideAllScreens();
  document.getElementById('partnersScreen').classList.remove('hidden');
  document.getElementById('topNav').classList.remove('hidden');
  loadPartnersData();
}

function showScreen(role) {
  if (!role) { showLanding(); return; }

  hideAllScreens();
  document.getElementById('topNav').classList.add('hidden');

  const userBar = document.getElementById('userBar');
  userBar.innerHTML = `Hi, ${getName()} (${role}) <button id="logoutBtn">Logout</button>`;
  document.getElementById('logoutBtn').onclick = () => { clearSession(); showLanding(); };

  if (role === 'donor') { document.getElementById('donorScreen').classList.remove('hidden'); loadDonorData(); }
  if (role === 'ngo') { document.getElementById('ngoScreen').classList.remove('hidden'); loadNgoData(); }
  if (role === 'worker') { document.getElementById('workerScreen').classList.remove('hidden'); loadWorkerData(); }
}

// ---------- Nav ----------
document.getElementById('navHome').onclick = () => showLanding();
document.getElementById('navImpact').onclick = () => showImpact();
document.getElementById('navPartners').onclick = () => showPartners();
document.getElementById('navAbout').onclick = () => {
  showLanding();
  document.getElementById('aboutSection').scrollIntoView({ behavior: 'smooth' });
};
document.getElementById('navGetStarted').onclick = () => showAuth();
document.getElementById('heroGetStartedBtn').onclick = () => showAuth();
document.getElementById('backToHomeBtn').onclick = () => showLanding();

// ---------- Generic modal ----------
function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalBox').innerHTML = '';
}

// ---------- Auth tabs ----------
document.getElementById('tabLogin').onclick = () => {
  document.getElementById('tabLogin').classList.add('active');
  document.getElementById('tabRegister').classList.remove('active');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
};
document.getElementById('tabRegister').onclick = () => {
  document.getElementById('tabRegister').classList.add('active');
  document.getElementById('tabLogin').classList.remove('active');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
};
document.getElementById('regRole').onchange = (e) => {
  document.getElementById('ngoOnlyField').classList.toggle('hidden', e.target.value !== 'ngo');
};

// ---------- Geolocation helpers ----------
document.getElementById('useLocationBtn').onclick = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById('regLat').value = pos.coords.latitude;
      document.getElementById('regLng').value = pos.coords.longitude;
      document.getElementById('locationStatus').textContent = '✓ Location captured';
    },
    () => { document.getElementById('locationStatus').textContent = 'Could not get location - allow permission'; }
  );
};

// ---------- Login ----------
document.getElementById('loginForm').onsubmit = async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    saveSession(data.token, data.user);
    showScreen(data.user.role);
  } catch (err) { alert(err.message); }
};

// ---------- Register ----------
document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();
  try {
    const body = {
      name: document.getElementById('regName').value,
      email: document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value,
      role: document.getElementById('regRole').value,
      phone: document.getElementById('regPhone').value,
      address: document.getElementById('regAddress').value,
      lat: document.getElementById('regLat').value,
      lng: document.getElementById('regLng').value,
      capacityKgPerDay: document.getElementById('regCapacity').value
    };
    if (!body.lat || !body.lng) { alert('Please capture your location first.'); return; }

    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(body) });
    saveSession(data.token, data.user);
    showScreen(data.user.role);
  } catch (err) { alert(err.message); }
};

// =========================================================
// DONOR DASHBOARD
// =========================================================
document.getElementById('useLocationBtnDonation').onclick = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById('donationLat').value = pos.coords.latitude;
      document.getElementById('donationLng').value = pos.coords.longitude;
      document.getElementById('donationLocationStatus').textContent = '✓ Location captured';
    },
    () => { document.getElementById('donationLocationStatus').textContent = 'Could not get location'; }
  );
};

document.getElementById('donationForm').onsubmit = async (e) => {
  e.preventDefault();
  try {
    const body = {
      donorType: document.getElementById('donorType').value,
      foodType: document.getElementById('foodType').value,
      description: document.getElementById('foodDesc').value,
      quantity: document.getElementById('quantity').value,
      unit: document.getElementById('unit').value,
      pickupAddress: document.getElementById('pickupAddress').value,
      lat: document.getElementById('donationLat').value,
      lng: document.getElementById('donationLng').value,
      expiryTime: document.getElementById('expiryTime').value
    };
    if (!body.lat || !body.lng) { alert('Please capture pickup location first.'); return; }

    const data = await api('/donations', { method: 'POST', body: JSON.stringify(body) });
    const resultEl = document.getElementById('donationResult');
    if (data.assignment) {
      resultEl.innerHTML = `<p class="notice">✓ Matched to an NGO and a cooperative worker has been assigned (fare ₹${data.assignment.fare}).</p>`;
    } else if (data.donation.ngo) {
      resultEl.innerHTML = `<p class="notice">✓ Matched to an NGO. Waiting for a cooperative worker to become available.</p>`;
    } else {
      resultEl.innerHTML = `<p class="notice">Posted. No NGO found nearby yet - we'll keep trying.</p>`;
    }
    document.getElementById('donationForm').reset();
    loadDonorData();
  } catch (err) { alert(err.message); }
};

async function loadDonorData() {
  try {
    const donations = await api('/donations');
    const list = document.getElementById('donorList');
    list.innerHTML = donations.map(d => `
      <div class="item">
        <strong>${d.foodType}</strong> - ${d.quantity} ${d.unit}
        <span class="status ${d.status}">${d.status}</span>
        <div>Pickup: ${d.pickupAddress}</div>
        ${d.ngo ? `<div>NGO: ${d.ngo.name}</div>` : ''}
      </div>
    `).join('') || '<p>No donations posted yet.</p>';
  } catch (err) { console.error(err); }
}

// =========================================================
// NGO DASHBOARD
// =========================================================
async function loadNgoData() {
  try {
    const me = await api('/users/me');
    document.getElementById('ngoVerifiedNotice').classList.toggle('hidden', me.verified);

    const donations = await api('/donations');
    const list = document.getElementById('ngoList');
    list.innerHTML = donations.map(d => `
      <div class="item">
        <strong>${d.foodType}</strong> - ${d.quantity} ${d.unit}
        <span class="status ${d.status}">${d.status}</span>
        <div>From: ${d.donor.name} (${d.donor.phone || 'no phone'})</div>
        <div>Pickup: ${d.pickupAddress}</div>
        ${d.status === 'delivered' ? `
          <button class="rate-btn" onclick="startRating('${d._id}', 'donor', '${d.donor._id}', '${d.donor.name}')">⭐ Rate Donor</button>
          <button class="rate-btn" onclick="rateWorkerForDonation('${d._id}')">⭐ Rate Worker</button>
        ` : ''}
      </div>
    `).join('') || '<p>No donations matched yet.</p>';
  } catch (err) { console.error(err); }
}

async function rateWorkerForDonation(donationId) {
  try {
    const assignment = await api(`/assignments/donation/${donationId}`);
    startRating(donationId, 'worker', assignment.worker._id, assignment.worker.name);
  } catch (err) { alert(err.message); }
}

// ---------- Star rating popup (used for both donor and worker ratings) ----------
function startRating(donationId, targetType, targetId, targetName) {
  let selectedStars = 0;
  const render = () => `
    <h3>Rate ${targetName}</h3>
    <div class="star-row">
      ${[1,2,3,4,5].map(n => `<span data-star="${n}" class="${n <= selectedStars ? 'selected' : ''}">★</span>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="cancel-btn" onclick="closeModal()">Cancel</button>
      <button class="confirm-btn" id="submitRatingBtn">Submit</button>
    </div>
  `;
  openModal(render());

  document.querySelectorAll('.star-row span').forEach(star => {
    star.onclick = () => {
      selectedStars = Number(star.dataset.star);
      openModal(render());
      wireStarClicks();
    };
  });
  function wireStarClicks() {
    document.querySelectorAll('.star-row span').forEach(star => {
      star.onclick = () => { selectedStars = Number(star.dataset.star); openModal(render()); wireStarClicks(); bindSubmit(); };
    });
    bindSubmit();
  }
  function bindSubmit() {
    document.getElementById('submitRatingBtn').onclick = async () => {
      if (!selectedStars) { alert('Please select a star rating'); return; }
      try {
        await api('/ratings', {
          method: 'POST',
          body: JSON.stringify({ donationId, targetType, targetId, stars: selectedStars })
        });
        closeModal();
        alert('Thanks for the rating!');
      } catch (err) { alert(err.message); }
    };
  }
  wireStarClicks();
}

// =========================================================
// WORKER DASHBOARD
// =========================================================
async function loadWorkerData() {
  try {
    const me = await api('/users/me');
    document.getElementById('workerEarnings').innerHTML =
      `Total earnings: ₹${me.totalEarnings} · Completed deliveries: ${me.completedDeliveries} · ` +
      `Status: ${me.available ? 'Available for new jobs' : 'On a delivery'}`;

    const assignments = await api('/assignments/mine');
    const list = document.getElementById('workerList');
    list.innerHTML = assignments.map(a => `
      <div class="item">
        <strong>${a.donation.foodType}</strong> (${a.donation.quantity} ${a.donation.unit})
        <span class="status ${a.status}">${a.status}</span>
        <div>Pickup from: ${a.donation.donor.name} - ${a.donation.pickupAddress}</div>
        <div>Deliver to NGO: ${a.ngo.name} - ${a.ngo.address}</div>
        <div>Distance: ${a.distanceKm} km · Fare: ₹${a.fare}</div>
        ${a.status === 'assigned' ? `<button onclick="openPickupChecklist('${a._id}')">Mark Picked Up</button>` : ''}
        ${a.status === 'picked_up' ? `<button onclick="updateAssignment('${a._id}', 'delivered')">Mark Delivered</button>` : ''}
      </div>
    `).join('') || '<p>No jobs assigned yet.</p>';
  } catch (err) { console.error(err); }
}

// ---------- Food safety checklist popup (before marking Picked Up) ----------
function openPickupChecklist(assignmentId) {
  openModal(`
    <h3>Food Safety Check</h3>
    <div class="checklist-item"><input type="checkbox" id="chk1" /><label for="chk1">Food is sealed or covered</label></div>
    <div class="checklist-item"><input type="checkbox" id="chk2" /><label for="chk2">Still within the stated expiry time</label></div>
    <div class="checklist-item"><input type="checkbox" id="chk3" /><label for="chk3">No visible signs of spoilage</label></div>
    <div class="modal-actions">
      <button class="cancel-btn" onclick="closeModal()">Cancel</button>
      <button class="confirm-btn" id="confirmPickupBtn">Confirm Pickup</button>
    </div>
  `);

  document.getElementById('confirmPickupBtn').onclick = () => {
    const foodSafetyCheck = {
      sealedOrCovered: document.getElementById('chk1').checked,
      withinExpiry: document.getElementById('chk2').checked,
      noSpoilageSigns: document.getElementById('chk3').checked
    };
    if (!foodSafetyCheck.sealedOrCovered || !foodSafetyCheck.withinExpiry || !foodSafetyCheck.noSpoilageSigns) {
      alert('Please confirm all three checks before pickup.');
      return;
    }
    closeModal();
    updateAssignment(assignmentId, 'picked_up', foodSafetyCheck);
  };
}

async function updateAssignment(id, status, foodSafetyCheck) {
  try {
    await api(`/assignments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, foodSafetyCheck }) });
    loadWorkerData();
  } catch (err) { alert(err.message); }
}

// =========================================================
// PUBLIC PAGES: IMPACT + PARTNERS
// =========================================================
async function loadImpactData() {
  try {
    const stats = await api('/public/impact');
    document.getElementById('impactKg').textContent = stats.totalKgSaved;
    document.getElementById('impactMeals').textContent = stats.estimatedMeals;
    document.getElementById('impactDeliveries').textContent = stats.totalDeliveries;
    document.getElementById('impactWages').textContent = stats.totalWagesPaid;
    document.getElementById('impactNgos').textContent = stats.ngoCount;
    document.getElementById('impactWorkers').textContent = stats.workerCount;
  } catch (err) { console.error(err); }
}

async function loadPartnersData() {
  try {
    const partners = await api('/public/partners');
    const list = document.getElementById('partnersList');
    list.innerHTML = partners.map(p => `
      <div class="partner-card">
        <div class="partner-info">
          <h4>${p.name}</h4>
          <p>${p.totalKg} kg donated · ${p.donations} donations</p>
        </div>
        <span class="badge badge-${p.badge.toLowerCase()}">${p.badge}</span>
      </div>
    `).join('') || '<p>No partners yet - be the first to donate!</p>';
  } catch (err) { console.error(err); }
}

// ---------- Boot ----------
showScreen(getRole());
