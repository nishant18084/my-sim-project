const socket = io();
let currentUser = null;
let activeContact = null;
let onlineList = [];

async function login() {
  const name = document.getElementById('usernameInput').value.trim();
  if (!name) return;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name })
  });
  const data = await res.json();
  currentUser = data.username;

  document.getElementById('authBox').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  document.getElementById('myProfile').textContent = currentUser;
  document.getElementById('myAvatar').textContent = currentUser[0];

  socket.emit('join', currentUser);
  loadUsers();
}

async function loadUsers() {
  const res = await fetch(`/api/users/${currentUser}`);
  const users = await res.json();
  const listEl = document.getElementById('usersList');
  listEl.innerHTML = '';

  users.forEach(u => {
    const isOnline = onlineList.includes(u.username);
    const div = document.createElement('div');
    div.className = `p-3 flex items-center cursor-pointer hover:bg-[#202c33] justify-between ${activeContact === u.username ? 'bg-[#2a3942]' : ''}`;
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#6b7b84] flex items-center justify-center font-bold text-white uppercase">${u.username[0]}</div>
        <div>
          <span class="font-medium text-sm capitalize block">${u.username}</span>
          <span class="text-xs ${isOnline ? 'text-green-400' : 'text-[#8696a0]'}">${isOnline ? 'online' : 'offline'}</span>
        </div>
      </div>
    `;
    div.onclick = () => selectContact(u.username, isOnline);
    listEl.appendChild(div);
  });
}

async function selectContact(target, isOnline) {
  activeContact = target;
  document.getElementById('chatTargetName').textContent = target;
  document.getElementById('chatTargetStatus').textContent = isOnline ? 'online' : 'offline';
  
  const avatarEl = document.getElementById('chatAvatar');
  avatarEl.classList.remove('hidden');
  avatarEl.textContent = target[0];

  document.getElementById('msgInput').disabled = false;
  document.getElementById('msgInput').focus();

  const res = await fetch(`/api/messages/${currentUser}/${target}`);
  const msgs = await res.json();
  const pane = document.getElementById('messagePane');
  pane.innerHTML = '';
  msgs.forEach(m => renderBubble(m));
  loadUsers();
}

function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text || !activeContact) return;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  socket.emit('send_msg', { sender: currentUser, receiver: activeContact, text, time });
  input.value = '';
}

function renderBubble(msg) {
  const isMe = msg.sender === currentUser;
  const bubble = document.createElement('div');
  bubble.className = `p-2 px-3 rounded-lg max-w-[65%] text-sm relative ${isMe ? 'bg-[#005c4b] self-end' : 'bg-[#202c33] self-start'}`;
  bubble.innerHTML = `<span>${msg.text}</span><span class="text-[10px] text-[#8696a0] ml-2 float-right mt-1">${msg.time || ''}</span>`;
  
  const pane = document.getElementById('messagePane');
  pane.appendChild(bubble);
  pane.scrollTop = pane.scrollHeight;
}

socket.on('online_users', (users) => {
  onlineList = users;
  if (currentUser) loadUsers();
});

socket.on('recv_msg', (msg) => {
  if (
    (msg.sender === activeContact && msg.receiver === currentUser) ||
    (msg.sender === currentUser && msg.receiver === activeContact)
  ) {
    renderBubble(msg);
  }
});
