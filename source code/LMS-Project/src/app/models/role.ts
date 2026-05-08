export interface Role {
  id: string;             // الـ GUID [cite: 54]
  name: string;           // اسم الـ Role [cite: 57]
  isDeleted: boolean;     // هل هو معطل؟ [cite: 60]
  isEnrollable: boolean;  // هل متاح للتسجيل التلقائي؟ [cite: 63]
  permissions?: string[]; // قائمة المفاتيح (Permissions) [cite: 98]
}

// Model خاص بالـ Permissions اللي بنجيبها من السيرفر عشان نعرضها في الـ Form
export interface PermissionResponse {
  count: number;          // عدد الصلاحيات [cite: 187]
  permissions: string[];  // الـ Keys نفسها [cite: 190]
}