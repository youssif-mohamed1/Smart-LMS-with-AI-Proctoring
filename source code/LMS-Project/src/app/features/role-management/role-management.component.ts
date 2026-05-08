import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { Role } from '../../models/role';
import { PermissionService } from '../../core/services/permission.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.css',
})
export class RoleManagementComponent implements OnInit {
  roles: Role[] = [];
  isLoading: boolean = false;

  // متغيرات الفورم
  showCreateForm: boolean = false;
  allPermissions: string[] = [];
  selectedPermissions: string[] = [];
  newRoleName: string = '';
  isEnrollable: boolean = false;

  // متغير التعديل
  editingRoleId: string | null = null;

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.roleService.getRoles(true).subscribe({
      next: (data) => {
        this.roles = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch roles:', err);
        this.isLoading = false;
      },
    });
  }

  loadPermissions(): void {
    this.roleService.getAllPermissions().subscribe({
      next: (res) => {
        this.allPermissions = res.permissions;
      },
      error: (err) => console.error('Failed to fetch permissions:', err),
    });
  }

  // فنكشن التعديل: تملأ البيانات في الفورم وتجيب الصلاحيات الحالية
  editRole(role: Role): void {
    this.showCreateForm = true;
    this.editingRoleId = role.id;
    this.newRoleName = role.name;
    this.isEnrollable = role.isEnrollable;

    // جلب بيانات الـ Role بالتفصيل للتأكد من الصلاحيات
    this.roleService.getRoleById(role.id).subscribe({
      next: (data) => {
        this.selectedPermissions = data.permissions || [];
      },
    });
  }

  toggleStatus(roleId: string): void {
    const role = this.roles.find((r) => r.id === roleId);
    if (!role) return;

    // Optimistic update
    role.isDeleted = !role.isDeleted;

    this.roleService.toggleRoleStatus(roleId).subscribe({
      error: () => {
        // Revert on failure
        role.isDeleted = !role.isDeleted;
        Swal.fire({
          icon: 'error',
          title: 'Toggle Failed',
          text: 'Could not update the role status. Please try again.',
          confirmButtonColor: '#41B3E3',
        });
      },
    });
  }

  onPermissionChange(permission: string, event: any): void {
    if (event.target.checked) {
      this.selectedPermissions.push(permission);
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(
        (p) => p !== permission,
      );
    }
  }

  saveRole(): void {
    if (!this.newRoleName) return;

    const roleData = {
      name: this.newRoleName,
      isEnrollable: this.isEnrollable, // القيمة اللي بتغيرها في الـ Switch
      permissions: this.selectedPermissions,
    };

    if (this.editingRoleId) {
      // حالة التعديل
      this.roleService.updateRole(this.editingRoleId, roleData).subscribe({
        next: () => {
          Swal.fire({
            title: 'Updated!',
            text: 'Role updated successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
          // نحدث الجدول الأول وبعدين نقفل الفورم
          this.loadRoles();
          this.resetForm();
        },
        error: (err) => console.error('Error updating role:', err),
      });
    } else {
      // حالة الإضافة
      this.roleService.createRole(roleData).subscribe({
        next: () => {
          Swal.fire({
            title: 'Created!',
            text: 'New role added successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadRoles();
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
    this.showCreateForm = false;
    this.editingRoleId = null;
    this.newRoleName = '';
    this.isEnrollable = false;
    this.selectedPermissions = [];
  }

  // فنكشن التأكد من الصلاحية
  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
}
