let currentUser = localStorage.getItem(STORAGE_KEYS.USER) || '';
let currentRoomId = 'public-room';
const syncChannel = new BroadcastChannel('wa_tab_sync');

function init() {
  if (currentUser) {
    showChat();
  }
}

function handleLogin() {
  const input = document.getElementById('usernameInput');
  const name = input.value.trim();
  if (!name) return;

  currentUser = name;
  localStorage.setItem(STORAGE_KEYS.USER, currentUser);
  showChat();
}

function showChat() {
  document.getElementById('authBox').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  document.getElementById('myProfile').textContent = currentUser;
  document.getElementById('myAvatar').textContent = currentUser[0];
  
  renderContacts();
  switchRoom(currentRoomId);
}

function handleLogout() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  location.reload();
}

function renderContacts() {
  const container = document.getElementById('contactsContainer');
  container.innerHTML = '';

  DEFAULT_ROOMS.forEach((room) => {
    const isSelected = room.id === currentRoomId;
    const div = document.createElement('div');
    div.className = `p-3 cursor-pointer flex items-center gap-3 transition ${isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`;
    div.innerHTML = `
      <div class="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-lg">
        ${room.tag}
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-baseline">
          <span class="font-semibold text-sm">${room.name}</span>
        </div>
        <p class="text-xs text-[#8696a0] truncate mt-0.5">${room.subtitle}</p>
      </div>
    `;
    div.onclick = () => switchRoom(room.id);
    container.appendChild(div);
  });
}

function switchRoom(roomId) {
  currentRoomId = roomId;
  const roomInfo = DEFAULT_ROOMS.find(r => r.id === roomId);
  document.getElementById('activeChatTitle').textContent = roomInfo.name;
  document.getElementById('chatAvatar').textContent = roomInfo.tag;
  
  // Mobile screen par chat select karte hi contact list hide karein
  if (window.innerWidth < 768) {
    document.getElementById('sidebarPane').classList.add('hidden');
  }

  renderContacts();
  loadMessages();
  document.getElementById('msgInput').focus();
}

function goBackToChats() {
  // Mobile par wapas contacts list dikhane ke liye
  document.getElementById('sidebarPane').classList.remove('hidden');
}

function loadMessages() {
  const pane = document.getElementById('messagePane');
  pane.innerHTML = '';
  const messages = getRoomMessages(currentRoomId);
  messages.forEach(renderBubble);
  pane.scrollTop = pane.scrollHeight;
}

function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text || !currentUser) return;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const messageData = {
    roomId: currentRoomId,
    user: currentUser,
    text: text,
    time: time,
    timestamp: Date.now()
  };

  saveRoomMessage(currentRoomId, messageData);
  syncChannel.postMessage(messageData);

  renderBubble(messageData);
  input.value = '';
  const pane = document.getElementById('messagePane');
  pane.scrollTop = pane.scrollHeight;
}

function renderBubble(msg) {
  const pane = document.getElementById('messagePane');
  const isMe = msg.user === currentUser;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble p-2 px-3 rounded-lg max-w-[75%] text-sm relative break-words ${
    isMe ? 'bg-[#005c4b] self-end' : 'bg-[#202c33] self-start'
  }`;

  bubble.innerHTML = `
    ${!isMe ? `<div class="text-[11px] font-semibold text-[#00a884] mb-0.5 capitalize">${msg.user}</div>` : ''}
    <div>${msg.text}</div>
    <div class="text-[9px] text-[#8696a0] text-right mt-1">${msg.time}</div>
  `;

  pane.appendChild(bubble);
}

syncChannel.onmessage = (event) => {
  if (event.data.roomId === currentRoomId) {
    renderBubble(event.data);
    const pane = document.getElementById('messagePane');
    pane.scrollTop = pane.scrollHeight;
  }
};

window.onload = init;
