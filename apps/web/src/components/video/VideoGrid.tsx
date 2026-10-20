import React from 'react';
import { VideoTile } from './VideoTile';
import { useRoomStore } from '../../store/useRoomStore';
import { Participant } from '@sangam/shared';

export const VideoGrid: React.FC = () => {
  const {
    myParticipant,
    participants,
    localStream,
    screenStream,
    remoteStreams,
    activeSpeakerId,
    pinnedPeerId,
    setPinnedPeerId,
    viewMode,
  } = useRoomStore();

  // Combine local participant and remote participants into a list
  const allParticipants: Participant[] = [];
  if (myParticipant) {
    allParticipants.push(myParticipant);
  }
  Object.values(participants).forEach((p) => {
    if (p.id !== myParticipant?.id && !p.inWaitingRoom) {
      allParticipants.push(p);
    }
  });

  // Check if anyone is sharing screen or pinned
  const presenter = allParticipants.find((p) => p.screenShareEnabled);
  const spotlightPeerId = pinnedPeerId || presenter?.id;
  const isSpotlightActive = !!spotlightPeerId || viewMode === 'speaker';

  // Get spotlight participant
  const spotlightParticipant =
    allParticipants.find((p) => p.id === spotlightPeerId) ||
    (allParticipants.find((p) => p.id === activeSpeakerId) ?? allParticipants[0]);

  // Dynamic grid column class
  const getGridColsClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-3 lg:grid-cols-4';
  };

  // 1. Spotlight / Presenter Mode
  if (isSpotlightActive && spotlightParticipant) {
    const isLocalSpotlight = spotlightParticipant.id === myParticipant?.id;
    const spotlightStream = isLocalSpotlight
      ? presenter?.id === myParticipant?.id && screenStream
        ? screenStream
        : localStream
      : remoteStreams[spotlightParticipant.id];

    const filmstripParticipants = allParticipants.filter((p) => p.id !== spotlightParticipant.id);

    return (
      <div className="w-full h-full flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
        {/* Main Stage */}
        <div className="flex-1 min-h-[300px] h-full flex items-center justify-center">
          <VideoTile
            participant={spotlightParticipant}
            stream={spotlightStream}
            isLocal={isLocalSpotlight}
            isSpeaking={activeSpeakerId === spotlightParticipant.id}
            isPinned={pinnedPeerId === spotlightParticipant.id}
            onTogglePin={() => setPinnedPeerId(pinnedPeerId ? null : spotlightParticipant.id)}
            className="w-full h-full max-h-full"
          />
        </div>

        {/* Filmstrip */}
        {filmstripParticipants.length > 0 && (
          <div className="w-full lg:w-72 shrink-0 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-48 lg:max-h-full py-1">
            {filmstripParticipants.map((p) => {
              const isLocal = p.id === myParticipant?.id;
              const stream = isLocal ? localStream : remoteStreams[p.id];
              return (
                <div key={p.id} className="w-48 lg:w-full h-32 shrink-0">
                  <VideoTile
                    participant={p}
                    stream={stream}
                    isLocal={isLocal}
                    isSpeaking={activeSpeakerId === p.id}
                    isPinned={false}
                    onTogglePin={() => setPinnedPeerId(p.id)}
                    className="w-full h-full"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 2. Uniform Dynamic Grid Mode
  return (
    <div className={`w-full h-full grid gap-3 p-3 auto-rows-fr ${getGridColsClass(allParticipants.length)}`}>
      {allParticipants.map((p) => {
        const isLocal = p.id === myParticipant?.id;
        const stream = isLocal ? localStream : remoteStreams[p.id];
        return (
          <VideoTile
            key={p.id}
            participant={p}
            stream={stream}
            isLocal={isLocal}
            isSpeaking={activeSpeakerId === p.id}
            isPinned={pinnedPeerId === p.id}
            onTogglePin={() => setPinnedPeerId(p.id)}
            className="w-full h-full min-h-[160px]"
          />
        );
      })}
    </div>
  );
};
