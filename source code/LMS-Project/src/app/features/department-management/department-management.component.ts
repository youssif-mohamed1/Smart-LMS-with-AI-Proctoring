import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { DepartmentService } from '../../core/services/department.service';
import { PermissionService } from '../../core/services/permission.service';
import { Department } from '../../models/department';

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './department-management.component.html',
  styleUrl: './department-management.component.css',
})
export class DepartmentManagementComponent implements OnInit {
  departments: Department[] = [];
  isLoading: boolean = false;
  loadFailed: boolean = false;
  showForm: boolean = false;
  editingDeptId: number | null = null;
  deptForm!: FormGroup;

  constructor(
    private deptService: DepartmentService,
    private fb: FormBuilder,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDepartments();
  }

  // ─── Form Initialization ───────────────────────────────────────────────────

  initForm(): void {
    this.deptForm = this.fb.group({
      title: ['', [Validators.required]],
    });
  }

  // ─── Load Departments (US1) ────────────────────────────────────────────────

  loadDepartments(): void {
    this.isLoading = true;
    this.loadFailed = false;
    this.deptService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadFailed = true;
        Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: 'Could not load departments. Please retry.',
          confirmButtonColor: '#41B3E3',
        });
      },
    });
  }

  // ─── Create Form (US2) ────────────────────────────────────────────────────

  openCreateForm(): void {
    this.resetForm();
  }

  // ─── Edit Department (US3) ────────────────────────────────────────────────

  editDept(dept: Department): void {
    this.editingDeptId = dept.id;
    this.showForm = true;
    this.deptForm.patchValue({ title: dept.title });
  }

  // ─── Save Department (Create or Edit) ─────────────────────────────────────

  saveDept(): void {
    // Guard: trim-aware validation
    if (
      this.deptForm.invalid ||
      !this.deptForm.value.title?.trim()
    ) {
      this.deptForm.markAllAsTouched();
      return;
    }

    const payload = { title: this.deptForm.value.title.trim() };

    if (this.editingDeptId === null) {
      // ── Create ──
      this.deptService.createDepartment(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Created!',
            text: 'Department created successfully.',
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadDepartments();
          this.closeForm();
        },
        error: (err) => {
          const msg =
            err.error?.message || err.error?.errorMessage || 'Operation failed';
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: typeof msg === 'string' ? msg : JSON.stringify(msg),
            confirmButtonColor: '#d33',
          });
        },
      });
    } else {
      // ── Update ──
      this.deptService.updateDepartment(this.editingDeptId, payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Department updated successfully.',
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadDepartments();
          this.closeForm();
        },
        error: (err) => {
          const msg =
            err.error?.message || err.error?.errorMessage || 'Update failed';
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: typeof msg === 'string' ? msg : JSON.stringify(msg),
            confirmButtonColor: '#d33',
          });
          if (err.status === 404) this.closeForm();
        },
      });
    }
  }

  // ─── Remove Department (US4) ──────────────────────────────────────────────

  removeDept(id: number): void {
    Swal.fire({
      title: 'Remove Department?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e63946',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deptService.deleteDepartment(id).subscribe({
          next: () => {
            // Remove row immediately without full reload
            this.departments = this.departments.filter((d) => d.id !== id);
            Swal.fire({
              icon: 'success',
              title: 'Removed!',
              text: 'Department removed successfully.',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            const msg =
              err.error?.message || err.error?.errorMessage || 'Remove failed';
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: typeof msg === 'string' ? msg : JSON.stringify(msg),
              confirmButtonColor: '#d33',
            });
          },
        });
      }
    });
  }

  // ─── Form Helpers ─────────────────────────────────────────────────────────

  closeForm(): void {
    this.showForm = false;
    this.editingDeptId = null;
    this.deptForm.reset();
  }

  resetForm(): void {
    this.editingDeptId = null;
    this.deptForm.reset();
    this.showForm = true;
  }

  // ─── Permission Helper ────────────────────────────────────────────────────

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
}
