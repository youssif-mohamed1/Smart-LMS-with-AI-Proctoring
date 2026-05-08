import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode'; // التأكد من وجود المكتبة

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor() {}

  private decodeToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // console.log(decoded); // هنا هيظهر لك الـ Object كامل زي الصورة اللي بعتها
        return decoded;
      } catch (error) {
        console.error('Invalid token format', error);
        return null;
      }
    } else {
      console.warn('No token found in localStorage');
      return null;
    }
  }


  getPermissions(): string[] {
    const decoded: any = this.decodeToken();
    // لاحظ إننا استخدمنا 'Permissions' بالـ P كابيتال زي ما هي طالعة عندك في الـ Console
    // console.log(decoded.Permissions)
    return decoded?.Permissions || [];
  }

  /**
   * الفنكشن اللي بنستخدمها في الـ HTML والـ Components
   */
  hasPermission(permissionName: string): boolean {
    const userPermissions = this.getPermissions();
    return userPermissions.includes(permissionName);
  }
}
