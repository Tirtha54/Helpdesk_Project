const token = localStorage.getItem('token');

// only admin can open this page
if (!token || localStorage.getItem('role') !== 'admin') {
  window.location = 'index.html';
}

const adminName = localStorage.getItem('name');
document.getElementById('adminName').innerText = adminName;
document.getElementById('avatar').innerText = adminName[0].toUpperCase();

const statuses = ['Pending', 'In Progress', 'Resolved', 'Approved', 'Rejected'];
let allTickets = [];


let page = 1;
const perPage = 8;
let lastKey = '';

function logout() {
  localStorage.clear();
  window.location = 'index.html';
}


function statusClass(s) {
  if (s === 'Approved' || s === 'Resolved') return 's-green';
  if (s === 'In Progress') return 's-blue';
  if (s === 'Rejected') return 's-red';
  return 's-orange';
}

function priorityBadge(p) {
  let c = 's-yellow';
  if (p === 'High') c = 's-red';
  if (p === 'Low') c = 's-green';
  return `<span class="pill ${c}">${p}</span>`;
}


function drawBars(boxId, names) {
  let html = '';
  names.forEach((n) => {
    const count = allTickets.filter(t => (t.category || 'IT Issue') === n || t.status === n).length;
    const percent = allTickets.length ? (count / allTickets.length) * 100 : 0;
    html += `
      <div class="mb-2">
        <small>${n} (${count})</small>
        <div class="bar-bg"><div class="bar-fill" style="width:${percent}%"></div></div>
      </div>`;
  });
  document.getElementById(boxId).innerHTML = html;
}


async function loadTickets() {
  const res = await fetch('/api/tickets', { headers: { 'Authorization': token } });
  if (res.status === 401) { logout(); return; }
  allTickets = await res.json();

  
  setCount('total', allTickets.length);
  setCount('pending', allTickets.filter(t => t.status === 'Pending').length);
  setCount('progress', allTickets.filter(t => t.status === 'In Progress').length);
  setCount('done', allTickets.filter(t => ['Approved', 'Resolved', 'Rejected'].includes(t.status)).length);

  drawBars('statusChart', statuses);
  drawBars('categoryChart', ['IT Issue', 'Leave Approval', 'Account & Access', 'Network', 'Hardware', 'Email', 'Other']);
  showTickets();
}


function quickFilter(status, priority) {
  document.getElementById('search').value = '';
  document.getElementById('fCategory').value = '';
  document.getElementById('fStatus').value = status;
  document.getElementById('fPriority').value = priority;
  showTickets();
  document.getElementById('ticketsCard').scrollIntoView({ behavior: 'smooth' });
}


function goPage(step) {
  page += step;
  showTickets();
}


function showTickets() {
  const search = document.getElementById('search').value.toLowerCase();
  const fStatus = document.getElementById('fStatus').value;
  const fPriority = document.getElementById('fPriority').value;
  const fCategory = document.getElementById('fCategory').value;

  const list = allTickets.filter(t =>
    (t.title.toLowerCase().includes(search) || t.user_name.toLowerCase().includes(search)) &&
    (!fStatus || t.status === fStatus) &&
    (!fPriority || t.priority === fPriority) &&
    (!fCategory || (t.category || 'IT Issue') === fCategory));

  
  const key = search + fStatus + fPriority + fCategory;
  if (key !== lastKey) { page = 1; lastKey = key; }

  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  if (page > totalPages) page = totalPages;
  const pageList = list.slice((page - 1) * perPage, page * perPage);

  let rows = '';
  pageList.forEach((t) => {
    let options = '';
    statuses.forEach((s) => {
      options += `<option ${t.status === s ? 'selected' : ''}>${s}</option>`;
    });

    rows += `
      <tr>
        <td>#${t.id}</td>
        <td>${esc(t.user_name)}</td>
        <td>${esc(t.title)}<br><small class="text-muted">${esc(t.description)}</small></td>
        <td>${esc(t.category || 'IT Issue')}</td>
        <td>${priorityBadge(t.priority)}</td>
        <td>
          <select class="form-select form-select-sm status-select ${statusClass(t.status)}" onchange="updateStatus(${t.id}, this.value)">
            ${options}
          </select>
        </td>
        <td>${new Date(t.created_at).toLocaleDateString()}</td>
        <td><button onclick="deleteTicket(${t.id})" class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`;
  });

  document.getElementById('ticketList').innerHTML = rows || '<tr><td colspan="8" class="text-center">No tickets found</td></tr>';

  document.getElementById('pager').innerHTML = `
    <button class="btn btn-outline-primary btn-sm" onclick="goPage(-1)" ${page === 1 ? 'disabled' : ''}>Previous</button>
    <span class="mx-3">Page ${page} of ${totalPages}</span>
    <button class="btn btn-outline-primary btn-sm" onclick="goPage(1)" ${page === totalPages ? 'disabled' : ''}>Next</button>`;
}


async function updateStatus(id, status) {
  await fetch('/api/tickets/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': token },
    body: JSON.stringify({ status })
  });
  showToast('Status changed to ' + status);
  loadTickets();
}


async function deleteTicket(id) {
  if (!confirm('Are you sure you want to delete this ticket?')) {
    return;
  }
  await fetch('/api/tickets/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': token }
  });
  showToast('Ticket deleted');
  loadTickets();
}


function openProfile() {
  new bootstrap.Modal(document.getElementById('profileModal')).show();
}


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

async function loadProfile() {
  const res = await fetch('/api/profile', { headers: { 'Authorization': token } });
  const user = await res.json();
  document.getElementById('profileName').value = user.name;
  document.getElementById('profileEmail').value = user.email;
  setPicture(user.profile_pic);
}

async function updateProfile() {
  const name = document.getElementById('profileName').value;
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': token },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  showToast(data.message, res.ok ? 'success' : 'error');
  if (res.ok) {
    localStorage.setItem('name', name);
    document.getElementById('adminName').innerText = name;
  }
}

async function uploadPicture() {
  const file = document.getElementById('picture').files[0];
  if (!file) {
    showToast('Please choose a picture first', 'error');
    return;
  }
  const formData = new FormData();
  formData.append('picture', file);

  const res = await fetch('/api/profile/picture', {
    method: 'POST',
    headers: { 'Authorization': token },  
    body: formData
  });
  const data = await res.json();
  showToast(data.message, res.ok ? 'success' : 'error');
  if (res.ok) setPicture(data.profile_pic);
}


loadTickets();
loadProfile();