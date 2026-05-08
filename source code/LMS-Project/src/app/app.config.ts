import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http'; // ضفنا HTTP_INTERCEPTORS هنا
import { TokenInterceptor } from './core/interceptors/token.interceptor'; // تأكد من المسار الصحيح للملف اللي لسه عامله

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), // عشان نشغل الـ Class-based interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
  ],
};
