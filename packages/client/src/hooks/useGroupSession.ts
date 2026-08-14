import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Preference } from '@consensus/shared';
import { useGroupStore } from '../store/groupStore.ts';
import type { MemberWithDisplay } from '../store/groupStore.ts';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useGroupSession(groupId: string, userId: string) {
  const socketRef = useRef<AppSocket | null>(null);
  const store = useGroupStore();

  useEffect(() => {
    const socket: AppSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      store.setConnectionStatus('connected');
      socket.emit('group:join', { groupId, userId });
    });

    socket.on('disconnect', () => {
      store.setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      store.setConnectionStatus('reconnecting');
    });

    // Full state snapshot — members arrive as GroupMember[] but the server
    // enriches them with displayName/avatarColor at query time.
    socket.on('group:state', (payload) => {
      store.setMembers(payload.members as unknown as MemberWithDisplay[]);
      for (const [memberId, preference] of Object.entries(payload.preferencesMap)) {
        store.setPreference(memberId, preference as Preference | null);
      }
      if (payload.latestConsensus) {
        store.setConsensusResult(payload.latestConsensus);
      }
    });

    socket.on('preference:updated', ({ groupMemberId, preferences }) => {
      store.setPreference(groupMemberId, preferences);
    });

    socket.on('consensus:updated', ({ result }) => {
      store.setConsensusResult(result);
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      store.setConnectionStatus('disconnected');
    };
  }, [groupId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePreference = useCallback((groupMemberId: string, preferences: Preference) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('preference:update', { groupMemberId, preferences });
    }
  }, []);

  return {
    group: store.group,
    members: store.members,
    preferencesMap: store.preferencesMap,
    consensusResult: store.consensusResult,
    connectionStatus: store.connectionStatus,
    currentUserId: store.currentUserId,
    currentGroupMemberId: store.currentGroupMemberId,
    updatePreference
  };
}
