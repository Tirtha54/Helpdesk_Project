const token = localStorage.getItem('token');
if (!token) {
  window.location = 'index.html';
}
// admin should use the admin page, not the user page
if (localStorage.getItem('role') === 'admin') {
  window.location = 'admin.html';
}

const myName = localStorage.getItem('name');
document.getElementById('userName').innerText = myName;
document.getElementById('avatar').innerText = myName[0].toUpperCase();

let allTickets = [];

function logout() {
  localStorage.clear();
  window.location = 'index.html';
}

// show the picture in the top-right avatar and in the profile card
function setPicture(pic) {
  if (!pic) return;
  const avatar = document.getElementById('avatar');
  avatar.innerText = '';
  avatar.style.backgroundImage = 'url(' + pic + ')';
  avatar.style.backgroundSize = 'cover';
  avatar.style.backgroundPosition = 'center';

  const img = document.getElementById('profileImg');
  img.src = pic;
  img.style.display = 'inline-block';
}

// switch between Dashboard / My Tickets / Raise Ticket / Profile
function showSection(id) {
  ['dashboard', 'tickets', 'raise', 'profile'].forEach((s) => {
    document.getElementById(s).style.display = (s === id) ? 'block' : 'none';
    document.getElementById('nav-' + s).classList.remove('active');
  });
  document.getElementById('nav-' + id).classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
}

// colour badges
function statusBadge(s) {
  let c = 's-orange';
  if (s === 'Approved' || s === 'Resolved') c = 's-green';
  if (s === 'In Progress') c = 's-blue';
  if (s === 'Rejected') c = 's-red';
  return `<span class="pill ${c}">${s}</span>`;
}

function priorityBadge(p) {
  let c = 's-yellow';
  if (p === 'High') c = 's-red';
  if (p === 'Low') c = 's-green';
  return `<span class="pill ${c}">${p}</span>`;
}

// make one table row
function makeRow(t) {
  return `
    <tr>
      <td>#${t.id}</td>
      <td>${esc(t.title)}</td>
      <td>${esc(t.category || 'IT Issue')}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${new Date(t.created_at).toLocaleDateString()}</td>
      <td><button onclick="viewTicket(${t.id})" class="btn btn-outline-primary btn-sm">View</button></td>
    </tr>`;
}

// get all my tickets from the server
async function loadTickets() {
  const res = await fetch('/api/tickets/my', { headers: { 'Authorization': token } });
  if (res.status === 401) { logout(); return; }
  allTickets = await res.json();

  // statistics cards
  setCount('total', allTickets.length);
  setCount('pending', allTickets.filter(t => t.status === 'Pending').length);
  setCount('progress', allTickets.filter(t => t.status === 'In Progress').length);
  setCount('done', allTickets.filter(t => ['Approved', 'Resolved', 'Rejected'].includes(t.status)).length);

  // recent 5 tickets on dashboard
  const recent = allTickets.slice(0, 5).map(makeRow).join('');
  document.getElementById('recentList').innerHTML = recent || '<tr><td colspan="7" class="text-center">No tickets yet</td></tr>';

  showTickets();
}

// show tickets in My Tickets (with search)
function showTickets() {
  const search = document.getElementById('search').value.toLowerCase();
  const list = allTickets.filter(t =>
    t.title.toLowerCase().includes(search) || (t.category || '').toLowerCase().includes(search));

  const rows = list.map(makeRow).join('');
  document.getElementById('ticketList').innerHTML = rows || '<tr><td colspan="7" class="text-center">No tickets found</td></tr>';
}

// RAISE A TICKET
async function raiseTicket() {
  const category = document.getElementById('category').value;
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const priority = document.getElementById('priority').value;
  const msg = document.getElementById('ticketMsg');

  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': token },
    body: JSON.stringify({ title, description, priority, category })
  });
  const data = await res.json();

  msg.className = res.ok ? 'text-success' : 'text-danger';
  msg.innerText = data.message;
  showToast(data.message, res.ok ? 'success' : 'error');

  if (res.ok) {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    loadTickets();
  }
}

// LOAD PROFILE
async function loadProfile() {
  const res = await fetch('/api/profile', { headers: { 'Authorization': token } });
  const user = await res.json();
  document.getElementById('profileName').value = user.name;
  document.getElementById('profileEmail').value = user.email;
  setPicture(user.profile_pic);
}

// UPDATE PROFILE
async function updateProfile() {
  const name = document.getElementById('profileName').value;

  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': token },
    body: JSON.stringify({ name })
  });
  const data = await res.json();

  document.getElementById('profileMsg').innerText = data.message;
  showToast('Profile updated');
  localStorage.setItem('name', name);
  document.getElementById('userName').innerText = name;
  document.getElementById('avatar').innerText = name[0].toUpperCase();
}

// UPLOAD PROFILE PICTURE
async function uploadPicture() {
  const file = document.getElementById('picture').files[0];
  const msg = document.getElementById('profileMsg');

  if (!file) {
    msg.className = 'text-danger';
    msg.innerText = 'Please choose a picture first';
    return;
  }

  const formData = new FormData();
  formData.append('picture', file);

  const res = await fetch('/api/profile/picture', {
    method: 'POST',
    headers: { 'Authorization': token },   // no Content-Type here, the browser sets it
    body: formData
  });
  const data = await res.json();

  msg.className = res.ok ? 'text-success' : 'text-danger';
  msg.innerText = data.message;
  showToast(data.message, res.ok ? 'success' : 'error');
  if (res.ok) {
    setPicture(data.profile_pic);
  }
}

// show full ticket details in a popup
function viewTicket(id) {
  const t = allTickets.find(x => x.id === id);
  document.getElementById('mTitle').innerText = t.title;
  document.getElementById('mDesc').innerText = t.description;
  document.getElementById('mCategory').innerText = t.category || 'IT Issue';
  document.getElementById('mPriority').innerHTML = priorityBadge(t.priority);
  document.getElementById('mStatus').innerHTML = statusBadge(t.status);
  document.getElementById('mDate').innerText = new Date(t.created_at).toLocaleString();
  new bootstrap.Modal(document.getElementById('ticketModal')).show();
}

// run when the page opens
loadTickets();
loadProfile();