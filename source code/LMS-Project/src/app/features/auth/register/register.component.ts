import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms'; // إضافات الـ Validation
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule], // لازم نضيف ReactiveFormsModule
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isRegistered = false;
  selectedFile: File | null = null;
  departments: any[] = []; // مصفوفة لتخزين الأقسام
  academicYears = [
    { value: 'first', label: 'First Year' },
    { value: 'second', label: 'Second Year' },
    { value: 'third', label: 'Third Year' },
    { value: 'fourth', label: 'Fourth Year' },
    { value: 'fifth', label: 'Fifth Year' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadDepartments();

    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        // الباسورد: مطلوب + 8 حروف على الأقل + Regex لحرف كبير وحرف صغير
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            // Regex: على الأقل رقم، وحرف كبير، وحرف صغير، ورمز من المجموعة (@$!%*?#&)
            Validators.pattern(
              '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?#&]).*',
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        dob: ['', [Validators.required]],
        departmentId: ['', [Validators.required]], // حقل القسم الجديد
        academicYear: ['', [Validators.required]], // سيخزن الآن 'first', 'second', إلخ
        profilePic: [null], // مفيش Validators.required هنا عشان تكون Optional
      },
      {
        // Validator على مستوى الفورم بالكامل لمقارنة الخانتين
        validators: this.passwordMatchValidator,
      },
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      // إحنا هنا بنحط الخطأ على الحقل نفسه
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      // هنا بنشيل أي أخطاء متعلقة بالمطابقة لو بقوا زي بعض
      const errors = form.get('confirmPassword')?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (!Object.keys(errors).length) {
          form.get('confirmPassword')?.setErrors(null);
        } else {
          form.get('confirmPassword')?.setErrors(errors);
        }
      }
    }
    // السطر ده هو اللي هيحل مشكلة الـ "Not all code paths return a value"
    return null;
  }

  loadDepartments() {
    this.authService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data; // تخزين البيانات اللي جاية من الباكيند
        console.log('Departments loaded:', this.departments);
      },
      error: (err) => {
        console.error('Error fetching departments:', err);
      },
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // بنحدث قيمة الـ control بس مش ضروري لو مش هنعمل عليه validation
      this.registerForm.patchValue({ profilePic: file });
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      const formData = new FormData();

      // إضافة الحقول الأساسية حسب أسامي الـ Backend في الـ Doc
      formData.append('FirstName', this.registerForm.get('firstName')?.value);
      formData.append('LastName', this.registerForm.get('lastName')?.value);
      formData.append('Email', this.registerForm.get('email')?.value);
      formData.append('Password', this.registerForm.get('password')?.value);
      formData.append('DateOfBirth', this.registerForm.get('dob')?.value);
      formData.append(
        'DepartmentId',
        this.registerForm.get('departmentId')?.value,
      );
      formData.append(
        'AcademicYear',
        this.registerForm.get('academicYear')?.value,
      );

      if (this.selectedFile) {
        formData.append('file', this.selectedFile, this.selectedFile.name);
      }

      // إرسال الـ FormData للـ Backend
      this.authService.register(formData).subscribe({
        next: (response) => {
          this.isRegistered = true;
        },
        error: (err) => {
          const apiErrorMessage = err.error?.errorMessage || '';

          // 1. حالة الإيميل موجود قبل كدة (Conflict 409)
          if (
            err.status === 409 ||
            apiErrorMessage.toLowerCase().includes('already exist')
          ) {
            Swal.fire({
              title: 'Email Already Exists',
              text: 'This email is already registered. Please try logging in or use another email.',
              icon: 'info', // أيقونة الـ Info بتبقى أنسب هنا
              confirmButtonText: 'Go to Login',
              showCancelButton: true,
              cancelButtonText: 'Try Again',
              confirmButtonColor: '#00bfff',
              background: '#1a1d21',
              color: '#fff',
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(['/login']); // يوديه للوجين لو الإيميل بتاعه فعلاً
              }
            });
          }
          // 2. أي خطأ تاني (زي الـ 500 اللي كان بيطلع مع الصورة)
          else {
            Swal.fire({
              title: 'Registration Error',
              text: 'Something went wrong. Please check your data or try again later.',
              icon: 'error',
              background: '#1a1d21',
              color: '#fff',
            });
          }
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
      this.scrollToFirstInvalidControl();
    }
  }

  resendConfirmation() {
    // بنسحب الإيميل اللي اليوزر كتبه في الفورم قبل ما ينجح التسجيل
    const email = this.registerForm.get('email')?.value;

    if (email) {
      // إظهار Loading بسيط عشان اليوزر يعرف إن الطلب شغال
      Swal.fire({
        title: 'Sending...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        background: '#1a1d21',
        color: '#fff',
      });

      this.authService.resendConfirmationEmail(email).subscribe({
        next: () => {
          Swal.fire({
            title: 'Link Resent!',
            text: 'Please check your inbox again, we’ve sent a new link.',
            icon: 'success',
            confirmButtonColor: '#00bfff',
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
            confirmButtonColor: '#d33',
            background: '#1a1d21',
            color: '#fff',
          });
        },
      });
    }
  }

  // فانكشن احترافية تخلي الصفحة تطلع لأول غلط
  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = document.querySelector(
      'input.ng-invalid',
    ) as HTMLElement;
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      firstInvalidControl.focus();
    }
  }
}
