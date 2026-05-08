import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          // console.log('Login Success! User Data:', response);

          // حفظ البيانات الأساسية
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('expinresIn', response.expinresIn);

          // حفظ بيانات العرض (UI)
          localStorage.setItem('firstName', response.firstName);
          localStorage.setItem('lastName', response.lastName); // ضيفنا الـ Last Name كمان بالمرة
          localStorage.setItem('userEmail', response.email);
          localStorage.setItem('userId', response.id); // الـ GUID مهم جداً

          // حفظ الصورة لو موجودة (ممكن تكون null)
          if (response.profilePictureUrl) {
            localStorage.setItem('profilePic', response.profilePictureUrl);
          }

          // الخطوة الجاية: التوجيه للـ Dashboard
          this.router.navigate(['/dashboard']);
        },

        error: (err) => {
          // بنجيب نص الرسالة اللي راجع من الـ Backend
          const apiErrorMessage = err.error?.errorMessage || '';

          if (err.status === 401) {
            // 1. حالة الإيميل غير مفعل (بنبحث عن كلمة confirmed في الرسالة)
            if (apiErrorMessage.toLowerCase().includes('not confirmed')) {
              Swal.fire({
                title: 'Account Not Verified',
                text: 'Please check your inbox and verify your email before logging in.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Resend Email', // اختيارية لو الـ Backend بيدعمها
                cancelButtonText: 'Maybe Later',
                confirmButtonColor: '#00bfff',
                cancelButtonColor: '#d33',
                background: '#1a1d21',
                color: '#fff',
              }).then((result) => {
                if (result.isConfirmed) {
                  // نأخذ الإيميل اللي اليوزر كتبه في الفورم
                  const email = this.loginForm.value.email;
                  this.resendLink(email);
                }
              });
            }
            // 2. حالة البيانات غلط (Invalid Email/password)
            else {
              Swal.fire({
                title: 'Login Failed',
                text: 'Invalid email or password. Please try again.',
                icon: 'error',
                confirmButtonColor: '#d33',
                background: '#1a1d21',
                color: '#fff',
              });
            }
          }
          // 3. أي حالة خطأ أخرى (Server Error مثلاً)
          else {
            Swal.fire({
              title: 'Oops!',
              text: 'Something went wrong. Please try again later.',
              icon: 'question',
              background: '#1a1d21',
              color: '#fff',
            });
          }
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  resendLink(email: string) {
    this.authService.resendConfirmationEmail(email).subscribe({
      next: () => {
        Swal.fire({
          title: 'Sent!',
          text: 'A new confirmation link has been sent to your email.',
          icon: 'success',
          background: '#1a1d21',
          color: '#fff',
        });
      },
      error: (err) => {
        // التعامل مع حالة الإيميل متفعل أصلاً (Error 400)
        const errorMsg = err.error?.errorMessage || 'Could not resend email.';
        Swal.fire({
          title: 'Note',
          text: errorMsg,
          icon: 'info',
          background: '#1a1d21',
          color: '#fff',
        });
      },
    });
  }
}
