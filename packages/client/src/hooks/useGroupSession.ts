import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Preference } from '@consensus/shared';
import { useGroupStore } from '../store/groupStore.ts';
import type { MemberWithDisplay } from '../store/groupStore.ts';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const DEBOUNCE_MS = 400;

export function useGroupSession(groupId: string, userId?: string | null) {
  const socketRef = useRef<AppSocket | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const store = useGroupStore();

  useEffect(() => {
    const validUserId = userId?.trim();
    if (!groupId || !validUserId) {
      store.setConnectionStatus('disconnected');
      return;
    }

    const token = localStorage.getItem('consensus_auth_token');

    const socket: AppSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
      // Send JWT in handshake so the server can optionally verify socket identity
      auth: { token: token ?? '' },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      store.setConnectionStatus('connected');
      socket.emit('group:join', { groupId, userId: validUserId });
    });

    socket.on('disconnect', () => {
      store.setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      store.setConnectionStatus('reconnecting');
    });

    // Full state snapshot — members arrive enriched with displayName/avatarColor/role
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
      console.log('Received Consensus:', result);
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

  /** Auto-save preference changes — does NOT trigger consensus */
  const updatePreference = useCallback((groupMemberId: string, preferences: Preference) => {
    if (!socketRef.current?.connected) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      console.log('[Socket Emit] preference:update for member:', groupMemberId);
      socketRef.current?.emit('preference:update', { groupMemberId, preferences });
      debounceTimerRef.current = null;
    }, DEBOUNCE_MS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Formal submission — sets submitted_at on server, triggers consensus when all done */
  const submitPreference = useCallback((groupMemberId: string, preferences: Preference) => {
    if (!socketRef.current?.connected) return;
    // Cancel any pending auto-save debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    console.log('[Socket Emit] preference:submit for member:', groupMemberId);
    socketRef.current?.emit('preference:submit', { groupMemberId, preferences });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Leader-only: force consensus generation */
  const generateConsensus = useCallback((groupId: string, userId: string) => {
    if (!socketRef.current?.connected) return;
    console.log('[Socket Emit] consensus:generate for group:', groupId);
    socketRef.current?.emit('consensus:generate', { groupId, userId });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    group: store.group,
    members: store.members,
    preferencesMap: store.preferencesMap,
    consensusResult: store.consensusResult,
    connectionStatus: store.connectionStatus,
    currentUserId: store.currentUserId,
    currentGroupMemberId: store.currentGroupMemberId,
    updatePreference,
    submitPreference,
    generateConsensus,
  };
}
