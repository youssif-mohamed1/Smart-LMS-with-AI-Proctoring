import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms'; // ضفنا الـ Reactive Forms
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // غيرنا الـ FormsModule لـ Reactive
    RouterModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder, // حقن الـ FormBuilder
  ) {}

  ngOnInit(): void {
    // بناء الفورم مع الـ Validations المطلوبة
    this.resetForm = this.fb.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            // Pattern محدث: لازم حرف كبير، حرف صغير، رقم، ورمز من المجموعة دي (@$!%*?&)
            Validators.pattern(
              '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?#&]).*',
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]], // الحقل الجديد
      },
      {
        validators: this.passwordMatchValidator, // التأكد من التطابق
      },
    );

    const email = this.route.snapshot.queryParamMap.get('email');
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!email || !code) {
      Swal.fire(
        'Error',
        'Invalid reset link. Please request a new one.',
        'error',
      ).then(() => this.router.navigate(['/auth/forgetPassword']));
    }
  }

  passwordMatchValidator(form: FormGroup) {
  const password = form.get('newPassword')?.value;
  const confirmPassword = form.get('confirmPassword')?.value;

  if (password !== confirmPassword) {
    form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
  } else {
    // إرجاع null لو متطابقين لمسح الأخطاء
    return null;
  }
  return null;
}

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const resetData = {
      email: this.route.snapshot.queryParamMap.get('email'),
      code: this.route.snapshot.queryParamMap.get('code'),
      newPassword: this.resetForm.value.newPassword,
    };

    this.authService.resetPassword(resetData).subscribe({
      next: () => {
        Swal.fire({
          title: 'Success!',
          text: 'Your password has been changed. You can now login with your new password.',
          icon: 'success',
          background: '#1a1d21',
          color: '#fff',
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.error?.errorMessage || 'Failed to reset password.',
          icon: 'error',
          background: '#1a1d21',
          color: '#fff',
        });
      },
    });
  }
}
