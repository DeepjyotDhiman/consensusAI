export interface BestMeetingTimeResult {
  bestSlot: string;
  slotLabel: string;
  overlapCount: number;
  totalMembers: number;
  matchPercentage: number;
  breakdown: Record<string, number>;
  participants: string[];
}

export const MEETING_TIME_PRESETS = [
  { id: 'Morning', label: 'Morning (9 AM - 12 PM)', icon: '🌅' },
  { id: 'Afternoon', label: 'Afternoon (12 PM - 5 PM)', icon: '☀️' },
  { id: 'Evening', label: 'Evening (5 PM - 9 PM)', icon: '🌙' },
  { id: 'Weekends', label: 'Weekends (Sat - Sun)', icon: '📅' },
] as const;

export function calculateBestMeetingTime(
  members: Array<{ id: string; userId?: string; displayName: string }>,
  preferencesMap: Record<string, any> = {}
): BestMeetingTimeResult {
  if (!members || members.length === 0) {
    return {
      bestSlot: 'Weekends',
      slotLabel: 'Weekends (Sat - Sun)',
      overlapCount: 0,
      totalMembers: 0,
      matchPercentage: 100,
      breakdown: { Morning: 0, Afternoon: 0, Evening: 0, Weekends: 0 },
      participants: [],
    };
  }

  const slotCounts: Record<string, number> = {
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Weekends: 0,
  };

  const slotParticipants: Record<string, string[]> = {
    Morning: [],
    Afternoon: [],
    Evening: [],
    Weekends: [],
  };

  members.forEach((member) => {
    const pref = preferencesMap[member.id] || preferencesMap[member.userId || ''];
    let selectedSlot = pref?.preferredMeetingTime;

    // Smart heuristic if preferredMeetingTime isn't explicitly set yet:
    // Default based on weekly availability hours
    if (!selectedSlot) {
      const avail = Number(pref?.availabilityHours || 15);
      if (avail >= 20) selectedSlot = 'Weekends';
      else if (avail >= 15) selectedSlot = 'Afternoon';
      else selectedSlot = 'Evening';
    }

    const slots = String(selectedSlot)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    slots.forEach((slot) => {
      const matched = MEETING_TIME_PRESETS.find(
        (p) => p.id.toLowerCase() === slot.toLowerCase() || p.label.toLowerCase().includes(slot.toLowerCase())
      );
      const slotKey = matched ? matched.id : 'Afternoon';
      slotCounts[slotKey] = (slotCounts[slotKey] ?? 0) + 1;
      const currentParticipants = slotParticipants[slotKey] ?? [];
      if (!currentParticipants.includes(member.displayName)) {
        currentParticipants.push(member.displayName);
        slotParticipants[slotKey] = currentParticipants;
      }
    });
  });

  // Find slot with maximum count
  let bestSlot = 'Afternoon';
  let maxCount = -1;

  Object.entries(slotCounts).forEach(([slotKey, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestSlot = slotKey;
    }
  });

  const overlapCount = maxCount > 0 ? maxCount : members.length;
  const matchPercentage = Math.round((overlapCount / members.length) * 100);
  const bestSlotParticipants = slotParticipants[bestSlot];
  const participants =
    bestSlotParticipants && bestSlotParticipants.length > 0
      ? bestSlotParticipants
      : members.map((m) => m.displayName);

  const matchedPreset = MEETING_TIME_PRESETS.find((p) => p.id === bestSlot);
  const slotLabel = matchedPreset ? `${matchedPreset.icon} ${matchedPreset.label}` : `☀️ ${bestSlot}`;

  return {
    bestSlot,
    slotLabel,
    overlapCount,
    totalMembers: members.length,
    matchPercentage,
    breakdown: slotCounts,
    participants,
  };
}
