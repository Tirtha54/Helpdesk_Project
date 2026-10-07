
async function register() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const msg = document.getElementById('msg');


  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();

  if (res.ok) {
    msg.className = 'text-success text-center';
    msg.innerText = 'Registered! Redirecting to login...';
    setTimeout(() => { window.location = 'index.html'; }, 1500);
  } else {
    msg.className = 'text-danger text-center';
    msg.innerText = data.message;
  }
}


async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const msg = document.getElementById('msg');

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (res.ok) {
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('name', data.name);

   
    if (data.role === 'admin') {
      window.location = 'admin.html';
    } else {
      window.location = 'user.html';
    }
  } else {
    msg.innerText = data.message;
  }
}


async function forgotPassword() {
  const email = document.getElementById('email').value;
  const msg = document.getElementById('msg');

  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();

  msg.className = res.ok ? 'text-success text-center' : 'text-danger text-center';
  msg.innerText = data.message;
}


async function resetPassword() {
  const password = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const token = new URLSearchParams(window.location.search).get('token');
  const msg = document.getElementById('msg');

  if (password !== confirm) {
    msg.className = 'text-danger text-center';
    msg.innerText = 'Passwords do not match';
    return;
  }

  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  const data = await res.json();

  if (res.ok) {
    msg.className = 'text-success text-center';
    msg.innerText = data.message + '. Redirecting to login...';
    setTimeout(() => { window.location = 'index.html'; }, 2000);
  } else {
    msg.className = 'text-danger text-center';
    msg.innerText = data.message;
  }
}


function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('i');

  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
  }
}