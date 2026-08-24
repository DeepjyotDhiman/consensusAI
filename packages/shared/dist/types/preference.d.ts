export interface Preference {
    id?: string;
    groupMemberId?: string;
    skills: string[] | string;
    availabilityHours: number;
    /** null means "no budget constraint specified" — treated as neutral in scoring */
    budget: number | null;
    interests: string[] | string;
    learningGoals: string[] | string;
    /** Ordered list of priority keywords, most important first */
    priorities?: string[] | string;
    notes?: string;
    /** Unix ms timestamp set when the member formally submits their preferences */
    submittedAt?: number | null;
    updatedAt?: number;
    topSkills?: string[];
    preferredMeetingTime?: string;
}
//# sourceMappingURL=preference.d.ts.map