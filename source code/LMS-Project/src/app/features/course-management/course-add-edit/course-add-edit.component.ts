import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Course } from '../../../models/course';

// ── Semester mapping helpers ────────────────────────────────────────────────
const SEMESTER_STR_TO_INT: Record<string, number> = { Fall: 1, Spring: 2, Summer: 3 };
const SEMESTER_INT_TO_STR: Record<number, string> = { 1: 'Fall', 2: 'Spring', 3: 'Summer' };

@Component({
  selector: 'app-course-add-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-add-edit.component.html',
  styleUrls: ['./course-add-edit.component.css'],
})
export class CourseAddEditComponent implements OnInit, OnChanges {

  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  /** Pass a Course object to open in Edit mode; leave null for Create mode. */
  @Input() courseData: Course | null = null;

  @Output() courseCreated = new EventEmitter<Course>();
  @Output() courseUpdated = new EventEmitter<Course>();
  @Output() modalDismissed = new EventEmitter<void>();

  // ── Form & UI State ───────────────────────────────────────────────────────
  form!: FormGroup;
  isSaving = false;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  departments: any[] = [];

  get isEditMode(): boolean { return this.courseData !== null; }

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private authService: AuthService,
    public permissionService: PermissionService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadDepartments();
    this.initForm();
    if (this.courseData) {
      this.patchForm(this.courseData);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseData'] && this.form) {
      if (this.courseData) {
        this.patchForm(this.courseData);
      } else {
        this.form.reset();
        this.form.get('departmentId')?.setValidators(Validators.required);
        this.form.get('departmentId')?.updateValueAndValidity();
        this.form.get('departmentId')?.enable();
        this.clearImage();
      }
    }
  }

  // ── Department Loading (T010) ─────────────────────────────────────────────

  loadDepartments(): void {
    this.authService.getDepartments().subscribe({
      next: (deps) => { this.departments = deps; },
      error: () => { this.departments = []; }
    });
  }

  // ── Form Initialization (T009) ────────────────────────────────────────────

  initForm(): void {
    this.form = this.fb.group({
      title:            ['', [Validators.required, Validators.minLength(5)]],
      description:      ['', Validators.required],
      semster:          [null, Validators.required],       // integer: 1, 2, 3
      academicLevel:    [null, Validators.required],       // integer: 1–5
      credit_Hour:      [null, [Validators.required, Validators.min(1), Validators.max(10)]],
      learningOutcomes: ['', Validators.required],
      departmentId:     [null, Validators.required],
    });
  }

  // ── Edit: Patch form with existing data (T023) ────────────────────────────

  patchForm(course: Course): void {
    const semesterInt = SEMESTER_STR_TO_INT[course.semster] ?? null;
    this.form.patchValue({
      title:            course.Title,
      description:      course.Description,
      semster:          semesterInt,
      academicLevel:    course.academicLevel ?? null,
      credit_Hour:      course.Credit_Hour,
      learningOutcomes: course.LearningOutcomes ?? '',
      departmentId:     course.departmentId ?? null,
    });
    // In edit mode, department is not sent to the backend, so it's not required
    this.form.get('departmentId')?.clearValidators();
    this.form.get('departmentId')?.updateValueAndValidity();
    
    // Show existing image as preview
    if (course.ImageUrl) {
      this.imagePreviewUrl = course.ImageUrl;
    }
  }

  // ── File Selection & Preview (T016) ───────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      Swal.fire({ icon: 'error', title: 'File too large', text: 'Image must be under 5 MB.', confirmButtonColor: '#41B3E3' });
      input.value = '';
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({ icon: 'error', title: 'Invalid format', text: 'Only JPEG, PNG, and WebP images are allowed.', confirmButtonColor: '#41B3E3' });
      input.value = '';
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.imagePreviewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
  }

  // ── FormData Construction (T017) ──────────────────────────────────────────

  buildFormData(): FormData {
    const fd = new FormData();
    const v = this.form.getRawValue(); // getRawValue includes disabled controls
    fd.append('title', v.title);
    fd.append('description', v.description);
    fd.append('semster', String(v.semster));
    fd.append('academicLevel', String(v.academicLevel));
    fd.append('credit_Hour', String(v.credit_Hour));
    fd.append('learningOutcomes', v.learningOutcomes);
    // Only append ImageFile if user selected a new file
    if (this.selectedFile) {
      fd.append('ImageFile', this.selectedFile, this.selectedFile.name);
    }
    return fd;
  }

  // ── Submit (T018 Create / T025 Edit) ──────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const fd = this.buildFormData();
    const departmentId = Number(this.form.getRawValue().departmentId);

    const request$ = this.isEditMode
      ? this.courseService.updateCourse(this.courseData!.Id, fd)
      : this.courseService.createCourse(departmentId, fd);

    request$.subscribe({
      next: (responseId: any) => {
        this.isSaving = false;

        // Construct the updated course locally to update the UI without an extra API call
        const v = this.form.getRawValue();
        const localCourse: Course = {
          Id: this.isEditMode ? this.courseData!.Id : (Number(responseId) || Math.floor(Math.random() * 10000)),
          Title: v.title,
          Description: v.description,
          semster: SEMESTER_INT_TO_STR[v.semster],
          academicLevel: v.academicLevel,
          Credit_Hour: v.credit_Hour,
          LearningOutcomes: v.learningOutcomes,
          departmentId: Number(v.departmentId),
          ImageUrl: this.imagePreviewUrl || (this.courseData?.ImageUrl || ''),
          IsPublished: this.courseData?.IsPublished || false
        };

        Swal.fire({
          icon: 'success',
          title: this.isEditMode ? 'Course Updated!' : 'Course Created!',
          timer: 2000,
          showConfirmButton: false,
        });
        
        if (this.isEditMode) {
          this.courseUpdated.emit(localCourse);
        } else {
          this.courseCreated.emit(localCourse);
        }
        this.closeModal();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.message || err?.error || 'An unexpected error occurred. Please try again.';
        Swal.fire({ icon: 'error', title: 'Save Failed', text: msg, confirmButtonColor: '#41B3E3' });
      }
    });
  }

  // ── Cancel / Dirty-State Guard (T029) ─────────────────────────────────────

  onCancel(): void {
    if (this.form.dirty) {
      Swal.fire({
        title: 'Discard changes?',
        text: 'Your unsaved changes will be lost.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Discard',
        cancelButtonText: 'Keep Editing',
        confirmButtonColor: '#E63946',
        cancelButtonColor: '#41B3E3',
      }).then(result => {
        if (result.isConfirmed) { this.closeModal(); }
      });
    } else {
      this.closeModal();
    }
  }

  // ── Close / Reset (T034, T035) ────────────────────────────────────────────

  closeModal(): void {
    this.form.reset();
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.modalDismissed.emit();
  }

  // ── Convenience getters for template validation display ───────────────────

  fc(name: string) { return this.form.get(name); }
  isInvalid(name: string): boolean {
    const c = this.fc(name);
    return !!(c?.invalid && c?.touched);
  }
}
