export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isDisabled: boolean; // لاحظ إن الـ API بيسميها isDisabled في الـ Get [cite: 209]
  academicYear?: string;
  departmentId: number;
  roles: string[];
}
