// ── HUB DO ÁGORA (AGORA OBSCUR) — CORE JAVASCRIPT ENGINE ──

// 1. Initial State & Persistent Gamification Data
const DEFAULT_USER = {
  name: "Investigador_409",
  tag: "#9281",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  role: "Iniciado VIP",
  level: 3,
  levelTitle: "Grau III — Guardião",
  xp: 1450,
  nextLevelXp: 2000,
  completedInvestigations: 8,
  driveReads: 34,
  badges: [
    { id: 'b1', icon: '📜', title: 'Primeira Leitura', desc: 'Acessou o acervo no Drive', unlocked: true },
    { id: 'b2', icon: '🔍', title: 'Explorador Urbano', desc: 'Participou de investigações Urbex', unlocked: true },
    { id: 'b3', icon: '⚖️', title: 'Guardião Cívico', desc: 'Mensagem enviada na Câmara', unlocked: true },
    { id: 'b4', icon: '🏛️', title: 'Mestre do Ágora', desc: 'Alcançou Grau IV de Iniciação', unlocked: false },
    { id: 'b5', icon: '📂', title: 'Leitor Voraz', desc: 'Mais de 50 documentos lidos', unlocked: false }
  ]
};

let currentUser = JSON.parse(localStorage.getItem('agora_user_state')) || DEFAULT_USER;

// Save user state
function saveUserState() {
  localStorage.setItem('agora_user_state', JSON.stringify(currentUser));
  renderUserHeader();
}

// Render User Header & XP Bar
function renderUserHeader() {
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');
  const levelTitleEl = document.getElementById('userLevelTitle');
  const xpCurrentEl = document.getElementById('xpCurrent');
  const xpNextEl = document.getElementById('xpNext');
  const xpFillEl = document.getElementById('xpFillBar');
  const statDocsEl = document.getElementById('statDocsRead');
  const statInvestEl = document.getElementById('statInvestCount');

  if (nameEl) nameEl.innerText = currentUser.name + " " + currentUser.tag;
  if (roleEl) roleEl.innerText = currentUser.role;
  if (avatarEl) avatarEl.src = currentUser.avatar;
  if (levelTitleEl) levelTitleEl.innerText = currentUser.levelTitle;
  if (xpCurrentEl) xpCurrentEl.innerText = currentUser.xp;
  if (xpNextEl) xpNextEl.innerText = currentUser.nextLevelXp;
  if (statDocsEl) statDocsEl.innerText = currentUser.driveReads;
  if (statInvestEl) statInvestEl.innerText = currentUser.completedInvestigations;

  if (xpFillEl) {
    const pct = Math.min(100, Math.round((currentUser.xp / currentUser.nextLevelXp) * 100));
    xpFillEl.style.width = pct + '%';
  }

  renderBadges();
}

// Add XP Function with Animation Toast
function addXP(amount, reason) {
  currentUser.xp += amount;
  if (currentUser.xp >= currentUser.nextLevelXp) {
    currentUser.level++;
    currentUser.nextLevelXp += 1500;
    currentUser.levelTitle = `Grau ${currentUser.level} — Iniciado Master`;
    showNotificationToast(`🎉 PARABÉNS! Você subiu para o ${currentUser.levelTitle}!`);
  } else {
    showNotificationToast(`⚡ +${amount} XP recebidos (${reason})`);
  }
  saveUserState();
}

// Render Badges Grid
function renderBadges() {
  const container = document.getElementById('badgesGridContainer');
  if (!container) return;

  container.innerHTML = currentUser.badges.map(b => `
    <div class="badge-card ${b.unlocked ? 'unlocked' : 'locked'}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-title">${b.title}</div>
      <div class="badge-desc">${b.desc}</div>
      <div style="font-size: 0.68rem; margin-top: 0.4rem; font-weight: 700; color: ${b.unlocked ? '#4ade80' : '#a1a1aa'};">
        ${b.unlocked ? '✓ Desbloqueado' : '🔒 Bloqueado'}
      </div>
    </div>
  `).join('');
}

// Discord Auth Simulation
function loginWithDiscord() {
  const mockNames = ['Lúcifer_Kadosh', 'Astral_Seeker', 'Piragibe_Fan', 'Valkyrie_88', 'Cronos_Obscur'];
  const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
  
  currentUser.name = randomName;
  currentUser.tag = '#' + Math.floor(1000 + Math.random() * 9000);
  currentUser.role = 'Membro VIP Discord';
  
  addXP(150, 'Conexão com Discord realizada');
  showNotificationToast('✅ Conta do Discord sincronizada com sucesso!');
}

// Tab Switching System
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content-panel').forEach(panel => panel.style.display = 'none');

  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  const activePanel = document.getElementById(`panel-${tabId}`);

  if (activeBtn) activeBtn.classList.add('active');
  if (activePanel) activePanel.style.display = 'block';
}

// Event Calendar Timers
const EVENTS_DATA = [
  { id: 1, title: '🎙️ Stage Talk: Dossiê Nova Acrópole ao Vivo', date: 'Hoje às 20:30', secondsLeft: 7200, category: 'Discord Stage' },
  { id: 2, title: '🗺️ Expedição Urbex: Rios Subterrâneos de SP', date: 'Quinta-feira às 19:00', secondsLeft: 184000, category: 'Urbex Live' },
  { id: 3, title: '📖 Debate sobre "O Livro dos Iniciados"', date: 'Sábado às 16:00', secondsLeft: 345000, category: 'Clube do Livro' }
];

function renderEvents() {
  const container = document.getElementById('eventsListContainer');
  if (!container) return;

  container.innerHTML = EVENTS_DATA.map(ev => `
    <div class="event-item">
      <div>
        <div class="event-title">${ev.title}</div>
        <div class="event-meta">
          <span>📅 ${ev.date}</span>
          <span>🏷️ ${ev.category}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="event-timer" id="eventTimer-${ev.id}">--:--:--</span>
        <button onclick="addXP(50, 'Lembrete de evento configurado')" class="btn-push-enable" style="padding: 0.3rem 0.6rem;">🔔 Lembrar</button>
      </div>
    </div>
  `).join('');

  startEventTimers();
}

function startEventTimers() {
  setInterval(() => {
    EVENTS_DATA.forEach(ev => {
      if (ev.secondsLeft > 0) ev.secondsLeft--;
      const el = document.getElementById(`eventTimer-${ev.id}`);
      if (el) {
        const h = Math.floor(ev.secondsLeft / 3600);
        const m = Math.floor((ev.secondsLeft % 3600) / 60);
        const s = ev.secondsLeft % 60;
        el.innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      }
    });
  }, 1000);
}

// Search Drive Documents
function filterDriveDocs() {
  const query = (document.getElementById('driveSearchInput')?.value || '').toLowerCase();
  const items = document.querySelectorAll('.drive-doc-item');

  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    if (text.includes(query)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Toast Notifications
function showNotificationToast(msg) {
  let toast = document.getElementById('hubToastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'hubToastNotification';
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: linear-gradient(135deg, #18181b, #27272a); border: 1px solid #c9a227; color: #fff; padding: 0.85rem 1.25rem; border-radius: 8px; font-size: 0.88rem; font-weight: 700; z-index: 10000; box-shadow: 0 8px 24px rgba(0,0,0,0.5); transition: all 0.3s ease;';
    document.body.appendChild(toast);
  }

  toast.innerText = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
  }, 4000);
}

// Service Worker Push Notifications Setup
function enablePushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showNotificationToast('🔔 Notificações ativadas com sucesso!');
        addXP(100, 'Ativou notificações push');
      } else {
        alert('Permissão de notificação negada no navegador.');
      }
    });
  } else {
    alert('Seu navegador não suporta notificações Push.');
  }
}

// Register SW
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/agora/sw.js')
    .then(reg => console.log('SW registrado no Ágora:', reg.scope))
    .catch(err => console.log('Falha no SW:', err));
}

// Init on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  renderUserHeader();
  renderEvents();
});
