import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { User } from '../../models/user';
import { Role } from '../../models/role';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  roles: Role[] = [];
  userForm!: FormGroup; // تعريف الفورم
  isLoading: boolean = false;
  showForm: boolean = false;
  editingUserId: string | null = null;
  departments: any[] = [];
  academicYears = [
    { label: 'None', value: 'Default' },
    { label: 'First', value: 'First' },
    { label: 'Second', value: 'Second' },
    { label: 'Third', value: 'Third' },
    { label: 'Fourth', value: 'Fourth' },
    { label: 'Fifth', value: 'Fifth' },
  ];

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private fb: FormBuilder,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadDepartments();
    this.initForm();
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

  initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      // الباسورد مع الـ Regex بتاعك
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?#&]).*',
          ),
        ],
      ],
      departmentId: [null], // اختياري
      roles: [[]],
      academicYear: ['Default'],
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers(true,true).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
        this.isLoading = false;
      },
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => (this.roles = data),
    });
  }

  editUser(user: User): void {
    this.editingUserId = user.id;
    this.showForm = true;

    // بنملى الفورم بالبيانات اللي معانا
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      departmentId: user.departmentId || null,
      roles: user.roles || [],
      academicYear: user.academicYear || 'Default',
    });

    // في التعديل الباسورد مش بيبقى Required
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  saveUser(): void {
    if (this.userForm.invalid) return;

    const userData = { ...this.userForm.value };

    if (this.editingUserId) {
      // --- Update Logic ---
      const { password, ...updateData } = userData;
      if (!updateData.academicYear) updateData.academicYear = 'Default';

      this.userService.updateUser(this.editingUserId, updateData).subscribe({
        next: () => {
          Swal.fire({
            title: 'Updated!',
            text: 'User updated successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadUsers();
          this.resetForm();
        },
        error: (err) => {
          console.error('API Error:', err);
          const serverMessage =
            err.error?.errorMessage ||
            err.error?.message ||
            err.error ||
            'Operation failed';

          Swal.fire({
            title: 'Error!',
            text:
              typeof serverMessage === 'string'
                ? serverMessage
                : JSON.stringify(serverMessage),
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        },
      });
    } else {
      // --- Create Logic ---
      const { academicYear, ...createData } = userData;

      this.userService.createUser(createData).subscribe({
        next: () => {
          Swal.fire({
            title: 'Created!',
            text: 'New user added successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadUsers();
          this.resetForm();
        },
        error: (err) => {
          console.error('API Error:', err);
          const serverMessage =
            err.error?.errorMessage ||
            err.error?.message ||
            err.error ||
            'Operation failed';

          Swal.fire({
            title: 'Error!',
            text:
              typeof serverMessage === 'string'
                ? serverMessage
                : JSON.stringify(serverMessage),
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        },
      });
    }
  }

  resetForm(): void {
    this.showForm = false;
    this.editingUserId = null;
    this.userForm.reset({
      academicYear: 'Default', // ده التعديل المهم
      roles: [],
      departmentId: null,
    });
    // نرجع الـ Validators للباسورد عشان الـ Create الجاي
    this.userForm
      .get('password')
      ?.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?#&]).*',
        ),
      ]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  toggleStatus(userId: string): void {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;

    // Optimistic update
    user.isDisabled = !user.isDisabled;

    this.userService.toggleUserStatus(userId).subscribe({
      error: () => {
        // Revert on failure
        user.isDisabled = !user.isDisabled;
        Swal.fire({
          icon: 'error',
          title: 'Toggle Failed',
          text: 'Could not update the user status. Please try again.',
          confirmButtonColor: '#41B3E3',
        });
      },
    });
  }

  // فنكشن التأكد من الصلاحية
  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
}
