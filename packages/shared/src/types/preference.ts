export interface Preference {
  id?: string;
  groupMemberId: string;
  skills: string[];
  availabilityHours: number;
  budget: number;
  interests: string[];
  learningGoals: string[];
  /** Ordered list of priority keywords, most important first */
  priorities: string[];
  notes: string;
  updatedAt?: number;
}
