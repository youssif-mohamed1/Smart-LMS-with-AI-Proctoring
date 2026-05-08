import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://localhost:7289/api/Authuntication';

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, {
      Email: data.email,
      Password: data.password,
    });
  }

  register(formData: FormData): Observable<any> {
    // الـ Endpoint حسب الـ Documentation هو /register
    return this.http.post(`${this.baseUrl}/register`, formData);
  }

  getDepartments(): Observable<any[]> {
    // الـ URL من الـ Swagger اللي بعته
    return this.http.get<any[]>('https://localhost:7289/api/Department').pipe(
      map(deps => deps.map(d => ({
        id: d.id ?? d.Id,
        title: d.title ?? d.Title
      })))
    );
  }

  confirmEmail(userId: string, code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/confirm_email`, {
      userId: userId,
      code: code,
    });
  }

  resendConfirmationEmail(email: string) {
    return this.http.post(`${this.baseUrl}/resend_confirm_email`, {
      email,
    });
  }

  // 1. طلب لينك إعادة التعيين
  forgotPassword(email: string) {
    return this.http.post(`${this.baseUrl}/forget-password`, {
      email: email,
    });
  }

  // 2. تعيين الباسورد الجديد فعلياً
  resetPassword(data: any): Observable<any> {
    // بنبعت الـ data مباشرة لأنها أصلاً Object فيه (email, code, newPassword)
    return this.http.post(`${this.baseUrl}/reset-password`, data);
  }

  // دالة إبطال التوكن (Logout من السيرفر)
  revokeToken(data: {
    token: string | null;
    refreshToken: string | null;
  }): Observable<any> {
    // بنضيف context أو header معين عشان الـ Interceptor يعرف إنه ميتدخلش هنا لو لزم الأمر
    return this.http.post(`${this.baseUrl}/revoke_refresh_token`, data);
  }

  // دالة تجديد التوكن
  refreshToken(data: {
    token: string | null;
    refreshToken: string | null;
  }): Observable<any> {
    // مهم جداً: الـ Interceptor لازم يتجاهل الـ request ده تحديداً
    // عشان لو التوكن منتهي ميروحش ينادي نفسه تاني
    return this.http.post(`${this.baseUrl}/refresh`, data);
  }

}
