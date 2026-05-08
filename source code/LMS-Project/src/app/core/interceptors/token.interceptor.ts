import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null,
  );

  constructor(public authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    // 1. استثناء طلبات اللوجين والريفريش من إضافة التوكن أو معالجة الـ 401
    // بتلم كل طلبات الـ Auth (Login, Register, Refresh, Forget Password...)
    if (request.url.toLowerCase().includes('authuntication') || request.url.toLowerCase().includes('department')) {
      console.log('Skipping Interceptor (No Header) for:', request.url);
      return next.handle(request);
    }

    // 2. إضافة التوكن لكل الطلبات الخارجية أوتوماتيكياً
    let authRequest = request;
    if (token) {
      authRequest = this.addToken(request, token);
    }

    return next.handle(authRequest).pipe(
      catchError((error) => {
        // لو السيرفر رجع 401 معناها التوكن انتهى
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(authRequest, next);
        }
        return throwError(() => error);
      }),
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const tokenModel = {
        token: localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken'),
      };

      // نداء الـ API لتجديد التوكن
      return this.authService.refreshToken(tokenModel).pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;

          // 3. حفظ البيانات الجديدة فوراً
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);

          this.refreshTokenSubject.next(response.token);

          // 4. إعادة إرسال الطلب الأصلي (LevelUp) بالتوكن الجديد
          // السطر ده هو اللي هيخلي الـ Level Up تكمل لوحدها بعد النجاح
          return next.handle(this.addToken(request, response.token));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          // لو فشل نهائياً، امسح البيانات
          // localStorage.clear();
          // هنا ممكن تضيف التوجيه للوجين لو حبيت
          console.log(err);
          return throwError(() => err);
        }),
      );
    }
    // لو فيه عملية Refresh شغالة حالياً، استنى لما تخلص وخد التوكن الجديد
    return this.refreshTokenSubject.pipe(
      filter((token) => token != null),
      take(1),
      switchMap((jwt) => next.handle(this.addToken(request, jwt))),
    );
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
}
