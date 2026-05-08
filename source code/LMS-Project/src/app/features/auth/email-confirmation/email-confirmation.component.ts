import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2'; // استيراد المكتبة

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-confirmation.component.html',
  styleUrls: ['./email-confirmation.component.css'],
})
export class EmailConfirmationComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const code = this.route.snapshot.queryParamMap.get('code');

    if (userId && code) {
      this.authService.confirmEmail(userId, code).subscribe({
        next: () => {
          // حالة النجاح
          Swal.fire({
            title: 'Account Verified!',
            text: 'Your email has been confirmed successfully. You can now log in.',
            icon: 'success',
            confirmButtonText: 'Go to Login',
            confirmButtonColor: '#00bfff',
            background: '#1a1d21',
            color: '#fff',
            allowOutsideClick: false, // عشان م يقفلش غير لما يدوس على الزرار
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (err) => {
          // حالة الـ Error (لينك بايظ أو مستخدم قبل كدة)
          Swal.fire({
            title: 'Verification Failed',
            text: err.error?.message || 'The link is invalid or has expired.',
            icon: 'error',
            confirmButtonText: 'Back to Login',
            confirmButtonColor: '#d33',
            background: '#1a1d21',
            color: '#fff',
            allowOutsideClick: false,
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
      });
    } else {
      // لو مفيش داتا أصلاً في اللينك
      this.router.navigate(['/login']);
    }
  }
}
