import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../../models/user'; // تأكد من مسار الموديل عندك

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // استبدل <host> بالدومين الفعلي الخاص بك كما هو موضح في صفحة 1 من الـ PDF
  private baseUrl = 'https://localhost:7289/api/Users';

  constructor(private http: HttpClient) {}

  /**
   * 1. جلب كل المستخدمين (صفحة 8 في الـ PDF)
   * @param includeNotConfirmed تضمين الحسابات التي لم يتم تأكيد إيميلها
   */
  private normalizeUser(u: any): User {
    return {
      id: u.id ?? u.Id,
      firstName: u.firstName ?? u.FirstName,
      lastName: u.lastName ?? u.LastName,
      email: u.email ?? u.Email,
      isDisabled: u.isDisabled ?? u.IsDisabled ?? false,
      academicYear: u.academicYear ?? u.AcademicYear,
      departmentId: u.departmentId ?? u.DepartmentId,
      roles: u.roles ?? u.Roles ?? []
    };
  }

  getUsers(
    includeNotConfirmed: boolean = true,
    includeDisabled: boolean = true,
  ): Observable<User[]> {
    const params = new HttpParams()
      .set('IncludeNotConfirmed', includeNotConfirmed.toString())
      .set('includeDisabled', includeDisabled.toString());

    return this.http.get<any[]>(this.baseUrl, { params }).pipe(
      map(users => users.map(u => this.normalizeUser(u)))
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(u => this.normalizeUser(u))
    );
  }

  /**
   * 3. جلب المدرسين التابعين لقسم معين (صفحة 9 في الـ PDF)##########################################################################
   */
  getInstructorsByDepartment(departmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${departmentId}/Instructors`);
  }

  /**
   * 4. إنشاء مستخدم جديد (صفحة 10 في الـ PDF)
   * البيانات المطلوبة: firstName, lastName, email, password, roles[], إلخ.
   */
  createUser(userData: any): Observable<User> {
    return this.http.post<User>(this.baseUrl, userData);
  }

  /**
   * 5. تحديث بيانات مستخدم موجود (صفحة 11 في الـ PDF)
   */
  updateUser(id: string, userData: any): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, userData);
  }

  /**
   * 6. تفعيل أو تعطيل حساب مستخدم (صفحة 11 في الـ PDF)
   * هذا الـ Endpoint يقوم بعمل soft-delete أو إعادة تفعيل
   */
  toggleUserStatus(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  /**
   * 7. فك قفل الحساب (صفحة 12 في الـ PDF)#############################################################################
   * يُستخدم عندما يتم قفل الحساب بسبب محاولات دخول خاطئة كثيرة
   */
  unlockUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/unlock`, {});
  }
}
