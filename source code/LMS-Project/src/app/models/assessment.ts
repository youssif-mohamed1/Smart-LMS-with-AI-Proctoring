export interface Assessment {
  assType: number;           // integer — unique per course; acts as identity key
  percentageWeight: number;  // decimal 0–100; sum of all per course must NOT exceed 100
  isMandatory: boolean;      // whether students must attempt this component
  hours: number;             // positive integer; allocated time for this component
}

export interface AssessmentType {
  value: number;  // integer code used in API payloads (maps to assType)
  name: string;   // display label shown in UI (e.g. "Final", "Quiz", "Lab")
}
