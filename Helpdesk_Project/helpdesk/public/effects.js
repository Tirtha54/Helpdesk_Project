
function showToast(message, type) {
  let box = document.querySelector('.toast-box');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toast-box';
    document.body.appendChild(box);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-item ' + (type === 'error' ? 'error' : '');
  toast.innerText = (type === 'error' ? '✕  ' : '✓  ') + message;
  box.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


const greetEl = document.getElementById('greeting');
if (greetEl) {
  const hour = new Date().getHours();
  greetEl.innerText = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function setCount(id, target) {
  const el = document.getElementById(id);
  const start = parseInt(el.innerText) || 0;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / 800, 1);  
    el.innerText = Math.round(start + (target - start) * progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function esc(text) {
  const d = document.createElement('div');
  d.innerText = text || '';
  return d.innerHTML;
}