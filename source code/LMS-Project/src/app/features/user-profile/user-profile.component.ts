import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserProfileService } from '../../core/services/user-profile.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service'; // تأكد من المسار الصح

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit {
  userProfile: any;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  activeTab: 'info' | 'password' | null = null;
  selectedFile: File | null = null;

  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private permissionService: PermissionService, // حقن السيرفس هنا
  ) {
    this.initForms();
  }

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  ngOnInit() {
    this.loadProfile();
  }

  initForms() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      academicYear: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?#&]).*',
          ),
        ],
      ],
    });
  }

  loadProfile() {
    this.userProfileService.getProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.profileForm.patchValue(data);
      },
    });
  }

  async updateInfo() {
    if (this.profileForm.valid) {
      const formData = new FormData();

      let academicYearValue = this.profileForm.get('academicYear')?.value;

      // لو معندوش صلاحية، بنجبر القيمة تبقى Default
      if (!this.hasPermission('Profile:levelUp')) {
        academicYearValue = 'Default';
      }

      formData.append('firstName', this.profileForm.get('firstName')?.value);
      formData.append('lastName', this.profileForm.get('lastName')?.value);
      formData.append(
        'dateOfBirth',
        this.profileForm.get('dateOfBirth')?.value,
      );
      formData.append('academicYear', academicYearValue);

      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
      } else if (this.userProfile?.profilePictureUrl) {
        try {
          const response = await fetch(this.userProfile.profilePictureUrl);
          const blob = await response.blob();
          const file = new File([blob], 'current-profile.jpg', {
            type: blob.type,
          });
          formData.append('file', file);
        } catch (e) {
          Swal.fire(
            'Error',
            'Could not process current profile image',
            'error',
          );
          return;
        }
      } else {
        Swal.fire(
          'Notice',
          'Please select a profile picture at least once',
          'warning',
        );
        return;
      }

      this.userProfileService.updateProfile(formData).subscribe({
        next: () => {
          Swal.fire('Success', 'Profile Updated Successfully', 'success');
          this.loadProfile();
        },
        error: (err) => Swal.fire('Error', 'Update Failed', 'error'),
      });
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('Selected file:', file.name);
    }
  }

  updatePassword() {
    if (this.passwordForm.valid) {
      this.userProfileService
        .changePassword(this.passwordForm.value)
        .subscribe({
          next: () => {
            Swal.fire('Success', 'Password changed successfully', 'success');
            this.passwordForm.reset();
          },
          error: (err) => {
            Swal.fire(
              'Error',
              err.error?.errorMessage || 'Failed to change password',
              'error',
            );
          },
        });
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }

  handleLevelUp() {
    this.userProfileService.levelUp().subscribe({
      next: () => {
        Swal.fire('Congrats!', 'You leveled up!', 'success');
        this.loadProfile(); // بنحدث البيانات عشان نشوف السنة الجديدة
      },
      error: (err) =>
        Swal.fire(
          'Notice',
          err.error?.errorMessage || 'Failed to level up',
          'info',
        ),
    });
  }

  onLogout() {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to sign out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4b2b',
      cancelButtonColor: '#333',
      confirmButtonText: 'Yes, Logout',
    }).then((result) => {
      if (result.isConfirmed) {
        // تجهيز البيانات المطلوبة حسب الـ Documentation
        const logoutData = {
          token: localStorage.getItem('token'),
          refreshToken: localStorage.getItem('refreshToken'),
        };

        // نداء السيرفر لإبطال التوكن
        this.authService.revokeToken(logoutData).subscribe({
          next: () => {
            localStorage.clear(); // بيمسح الـ token والـ refreshToken وكل حاجة
            this.router.navigate(['/login']);
          },
          error: (err) => {
            console.error(
              'Server logout failed, but clearing local data anyway',
              err,
            );
            localStorage.clear(); // بيمسح الـ token والـ refreshToken وكل حاجة
            this.router.navigate(['/login']);
          },
        });
      }
    });
  }
}
