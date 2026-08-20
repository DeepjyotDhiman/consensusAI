export interface Preference {
  id?: string;
  groupMemberId: string;
  skills: string[] | string;
  availabilityHours: number;
  budget: number;
  interests: string[] | string;
  learningGoals: string[] | string;
  /** Ordered list of priority keywords, most important first */
  priorities?: string[];
  notes?: string;
  updatedAt?: number;
}
