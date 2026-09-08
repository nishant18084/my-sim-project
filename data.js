// Default channels & storage helpers
const DEFAULT_ROOMS = [
  { id: 'public-room', name: 'Public Chat Room', tag: '#', subtitle: 'Sabhi users ke messages yahan aayenge' },
  { id: 'dev-team', name: 'Dev Team Updates', tag: 'D', subtitle: 'Project releases aur commits' }
];

const STORAGE_KEYS = {
  USER: 'wa_current_user',
  CHATS: 'wa_room_messages_'
};

function getRoomMessages(roomId) {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS + roomId) || '[]');
}

function saveRoomMessage(roomId, message) {
  const messages = getRoomMessages(roomId);
  messages.push(message);
  localStorage.setItem(STORAGE_KEYS.CHATS + roomId, JSON.stringify(messages));
}
