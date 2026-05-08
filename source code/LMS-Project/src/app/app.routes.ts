import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing/landing-page/landing-page.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { EmailConfirmationComponent } from './features/auth/email-confirmation/email-confirmation.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { authGuard } from './core/guards/auth.guard';
import { RoleManagementComponent } from './features/role-management/role-management.component';
import { UserManagementComponent } from './features/user-management/user-management.component';
import { permissionGuard } from './core/guards/permission.guard';
import { DepartmentManagementComponent } from './features/department-management/department-management.component';
import { CourseViewComponent } from './features/course-management/course-view/course-view.component';
import { ContentViewComponent } from './features/content/content-view/content-view.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forget-password', component: ForgotPasswordComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'Auth/emailConfrimation', component: EmailConfirmationComponent },
  { path: 'auth/forgetPassword', component: ResetPasswordComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // القفل الرئيسي
    children: [
      // هنا بقى "الأبناء" اللي هيظهروا جوه الـ router-outlet بتاع الداشبورد
      {
        path: 'roles',
        component: RoleManagementComponent,
        canActivate: [permissionGuard], // القفل الجديد
        data: { permission: 'roles:read' }, // المفتاح المطلوب
      },
      {
        path: 'users',
        component: UserManagementComponent,
        canActivate: [permissionGuard],
        data: { permission: 'users:read' },
      },
      {
        path: 'departments',
        component: DepartmentManagementComponent,
        canActivate: [permissionGuard],
        data: { permission: 'Department:read' },
      },
      // مسار افتراضي عشان لما يفتح Dashboard متبقاش فاضية
      // { path: '', redirectTo: 'users', pathMatch: 'full' },

      // ── Course Management — Cycle 1 ──────────────────────────────────
      {
        path: 'courses',
        component: CourseViewComponent,
        canActivate: [permissionGuard],
        data: { permission: ['Course:read', 'Course:readAll'] },
      },
      // Redirect stubs — future cycles will replace these with real components
      { path: 'courses/new/edit',         redirectTo: 'courses', pathMatch: 'full' },
      { path: 'courses/:id/edit',         redirectTo: 'courses', pathMatch: 'full' },
      { path: 'courses/:id/assessments',  redirectTo: 'courses', pathMatch: 'full' },
      { path: 'courses/:id/enrollment',   redirectTo: 'courses', pathMatch: 'full' },

      // ── Content View — Cycle 4 ───────────────────────────────────────
      {
        path: 'courses/:courseId/content',
        component: ContentViewComponent,
        canActivate: [permissionGuard],
        data: { permission: 'Content:read' },
      },
    ],
  },
  { path: '', component: LandingPageComponent },
  { path: '**', redirectTo: '' },
];
