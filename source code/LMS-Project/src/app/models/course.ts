export interface Course {
  Id: number;
  Title: string;
  Description: string;
  ImageUrl: string;
  semster: string;           // intentional API typo; string value from backend ("Fall"/"Spring"/"Summer")
  Credit_Hour: number;
  IsPublished: boolean;
  LearningOutcomes?: string; // comma-separated string; optional for backward compat with list endpoints
  academicLevel?: number;    // 1–5; optional for backward compat
  departmentId?: number;     // required for Add/Edit; optional for list view
}
