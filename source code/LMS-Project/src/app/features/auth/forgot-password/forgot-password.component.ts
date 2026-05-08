import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.css'], // هنستخدم نفس الـ CSS بتاع اللوجين
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isEmailSent = false;

  email: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  sendResetLink() {
    if (this.forgotPasswordForm.valid) {
      // اسحب الإيميل من الفورم نفسها مش من متغير خارجي
      const emailValue = this.forgotPasswordForm.value.email;
      
      this.authService.forgotPassword(emailValue).subscribe({
        next: () => {
          this.isEmailSent = true; // عشان يظهر رسالة النجاح في الـ HTML
          Swal.fire({
            title: 'Check Your Email',
            text: 'If this email exists, a reset link has been sent.',
            icon: 'success',
            background: '#1a1d21',
            color: '#fff',
          });
        },
        error: (err) => {
          Swal.fire({
            title: 'Error',
            text:
              err.error?.errorMessage ||
              'Something went wrong, please try again.',
            icon: 'error',
            background: '#1a1d21',
            color: '#fff',
          });
        },
      });
    } else {
      // لو الفورم مش فاليد (الإيميل مكتوب غلط مثلاً)
      this.forgotPasswordForm.markAllAsTouched();
    }
  }
}
