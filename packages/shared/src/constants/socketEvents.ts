export const SOCKET_EVENTS = {
  // Connection & Room Management
  ROOM_JOIN_REQUEST: 'room:join-request',
  ROOM_JOIN_RESPONSE: 'room:join-response',
  ROOM_USER_JOINED: 'room:user-joined',
  ROOM_USER_LEFT: 'room:user-left',
  ROOM_UPDATE_STATE: 'room:update-state',
  ROOM_ERROR: 'room:error',
  ROOM_LOCK_TOGGLE: 'room:lock-toggle',
  ROOM_END_ALL: 'room:end-all',

  // Waiting Room / Lobby
  LOBBY_USER_WAITING: 'lobby:user-waiting',
  LOBBY_ADMIT_USER: 'lobby:admit-user',
  LOBBY_DENY_USER: 'lobby:deny-user',
  LOBBY_STATUS_UPDATE: 'lobby:status-update',

  // WebRTC Signaling
  SIGNAL_OFFER: 'signal:offer',
  SIGNAL_ANSWER: 'signal:answer',
  SIGNAL_ICE_CANDIDATE: 'signal:ice-candidate',
  SIGNAL_RESTART_ICE: 'signal:restart-ice',

  // Media & Controls
  TRACK_STATE_CHANGE: 'media:track-state-change',
  ACTIVE_SPEAKER_CHANGE: 'media:active-speaker',
  HOST_MUTE_PARTICIPANT: 'host:mute-participant',
  HOST_MUTE_ALL: 'host:mute-all',
  HOST_KICK_PARTICIPANT: 'host:kick-participant',
  HOST_PROMOTE_COHOST: 'host:promote-cohost',

  // Screen Sharing
  SCREEN_SHARE_START: 'screen:start',
  SCREEN_SHARE_STOP: 'screen:stop',
  SCREEN_SHARE_OVERRIDE: 'screen:override',

  // Hand Raise & Reactions
  HAND_RAISE_TOGGLE: 'reaction:hand-raise-toggle',
  EMOJI_REACTION_SEND: 'reaction:emoji-send',

  // Chat
  CHAT_MESSAGE_SEND: 'chat:message-send',
  CHAT_MESSAGE_RECEIVE: 'chat:message-receive',

  // Encrypted Files
  FILE_SHARED_ANNOUNCE: 'file:shared-announce',
  FILE_DELETE_REQUEST: 'file:delete-request',

  // Whiteboard Yjs / Delta
  WHITEBOARD_UPDATE: 'whiteboard:update',
  WHITEBOARD_CURSOR: 'whiteboard:cursor',
  WHITEBOARD_CLEAR: 'whiteboard:clear',
  WHITEBOARD_LOCK_TOGGLE: 'whiteboard:lock-toggle',

  // Polls
  POLL_CREATE: 'poll:create',
  POLL_VOTE: 'poll:vote',
  POLL_END: 'poll:end',
  POLL_UPDATE: 'poll:update',

  // Breakout Rooms
  BREAKOUT_START: 'breakout:start',
  BREAKOUT_JOIN: 'breakout:join',
  BREAKOUT_END: 'breakout:end',

  // Captions
  CAPTION_BROADCAST: 'caption:broadcast',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
