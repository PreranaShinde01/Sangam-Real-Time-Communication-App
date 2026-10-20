# Sangam: Real-Time Socket.io Event Reference

All socket communications on Sangam are organized into typed event namespaces.

## 1. Room Management & Lobby

| Event | Direction | Payload | Description |
|---|---|---|---|
| `room:join-request` | Client -> Server | `{ roomId, passcode?, audioEnabled?, videoEnabled? }` | User initiates room join request |
| `room:join-response` | Server -> Client | `{ success, roomState, participant, polls, breakout }` | Welcome payload with active room state |
| `room:user-joined` | Server -> Broadcast | `Participant` | Notifies active peers of newcomer |
| `room:user-left` | Server -> Broadcast | `{ socketId, name }` | Peer departure cleanup |
| `lobby:status-update` | Server -> Client | `{ inWaitingRoom: boolean, message?: string }` | Waiting room status notification |
| `lobby:admit-user` | Host -> Server | `{ socketId: string }` | Host admits participant from waiting lobby |
| `lobby:deny-user` | Host -> Server | `{ socketId: string }` | Host denies entrance |

## 2. WebRTC Mesh Signaling

| Event | Direction | Payload | Description |
|---|---|---|---|
| `signal:offer` | Peer A -> Server -> Peer B | `{ targetSocketId, sdp }` | Relays RTCSessionDescriptionInit (Offer) |
| `signal:answer` | Peer B -> Server -> Peer A | `{ targetSocketId, sdp }` | Relays RTCSessionDescriptionInit (Answer) |
| `signal:ice-candidate` | Peer -> Server -> Peer | `{ targetSocketId, candidate }` | Relays RTCIceCandidateInit |
| `signal:restart-ice` | Peer -> Server -> Peer | `{ targetSocketId }` | Requests ICE restart on network degradation |

## 3. Media & Moderation

| Event | Direction | Payload | Description |
|---|---|---|---|
| `media:track-state-change` | Client -> Server -> All | `{ audioEnabled?, videoEnabled?, screenShareEnabled? }` | Updates mic/camera/screen state |
| `media:active-speaker` | Client -> Server -> All | `{ isSpeaking: boolean }` | Voice activity detection state |
| `host:mute-participant` | Host -> Server -> Peer | `{ targetSocketId: string }` | Forces participant mute |
| `host:mute-all` | Host -> Server -> All | none | Mutes all participants |
| `host:kick-participant` | Host -> Server -> Peer | `{ targetSocketId: string }` | Removes user from call |
| `room:lock-toggle` | Host -> Server -> All | `{ isLocked: boolean }` | Locks/unlocks room |

## 4. Collaboration: Chat, Whiteboard, Files, Polls

| Event | Direction | Payload | Description |
|---|---|---|---|
| `chat:message-send` | Client -> Server | `{ text, recipientId? }` | Sends public or direct 1:1 chat |
| `chat:message-receive` | Server -> Client(s) | `ChatMessage` | Delivers chat message |
| `reaction:emoji-send` | Client -> Server -> All | `{ emoji: string }` | Triggers floating emoji burst |
| `reaction:hand-raise-toggle` | Client -> Server -> All | none | Toggles hand raise status |
| `file:shared-announce` | Client -> Server -> All | `SharedFileMetadata` | Announces encrypted file availability |
| `whiteboard:update` | Client -> Server -> All | `{ elements, page }` | Synchronizes canvas drawings |
| `whiteboard:clear` | Client -> Server -> All | `{ page }` | Clears canvas |
| `poll:create` | Client -> Server -> All | `{ question, options, isAnonymous }` | Initiates new live poll |
| `poll:vote` | Client -> Server -> All | `{ pollId, optionId }` | Casts vote on poll option |
| `caption:broadcast` | Client -> Server -> All | `{ text, isFinal }` | Live speech-to-text subtitles |
