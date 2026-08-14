import type { ConnectionStatus } from '../store/groupStore.ts';

interface Props {
  connectionStatus: ConnectionStatus;
}

export default function RealtimeBadge({ connectionStatus }: Props) {
  if (connectionStatus === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
        </span>
        Live
      </span>
    );
  }

  if (connectionStatus === 'reconnecting') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Reconnecting...
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
      <span className="inline-flex rounded-full h-2 w-2 bg-red-400" />
      Disconnected
    </span>
  );
}
