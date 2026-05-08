import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { CourseService } from '../../../core/services/course.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Course } from '../../../models/course';
import { CourseAddEditComponent } from '../course-add-edit/course-add-edit.component';
import { CourseAssessmentComponent } from '../course-assessment/course-assessment.component';
import { CourseEnrollmentComponent } from '../course-enrollment/course-enrollment.component';

@Component({
  selector: 'app-course-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CourseAddEditComponent, CourseAssessmentComponent, CourseEnrollmentComponent],
  templateUrl: './course-view.component.html',
  styleUrls: ['./course-view.component.css'],
})
export class CourseViewComponent implements OnInit {
  @ViewChild(CourseAddEditComponent) addEditComponent!: CourseAddEditComponent;
  @ViewChild(CourseAssessmentComponent) assessmentComponent!: CourseAssessmentComponent;
  @ViewChild(CourseEnrollmentComponent) enrollmentComponent!: CourseEnrollmentComponent;

  // ── State ──────────────────────────────────────────────────────────────────
  courses: Course[] = [];
  filteredCourses: Course[] = [];

  // Filter States
  searchTerm: string = '';
  selectedSemester: string = '';

  isLoading = false;
  loadFailed = false;

  // ── Permission Flags ──────────────────────────────────────────────────────
  canAddCourse = false;
  canUpdateCourse = false;
  canDeleteCourse = false;
  canEnrollCourse = false;
  canReadAllCourses = false;
  canReadCourse = false;

  // ── Modal State (T014) ────────────────────────────────────────────────────
  selectedCourse: Course | null = null;
  private modalInstance: any = null;

  constructor(
    private courseService: CourseService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.canAddCourse = this.permissionService.hasPermission('Course:add');
    this.canUpdateCourse = this.permissionService.hasPermission('Course:update');
    this.canDeleteCourse = this.permissionService.hasPermission('Course:delete');
    this.canEnrollCourse = this.permissionService.hasPermission('Course:enrollInstructor') || this.permissionService.hasPermission('Course:unenrollInstructor');
    this.canReadAllCourses = this.permissionService.hasPermission('Course:readAll');
    this.canReadCourse =
      this.permissionService.hasPermission('Course:read') ||
      this.permissionService.hasPermission('Course:readAll');

    this.loadCourses();
  }

  // ── Data Fetching (T005, T006, T008, T009) ─────────────────────────────────

  loadCourses(): void {
    this.isLoading = true;
    this.loadFailed = false;

    // FR-014: auto-select endpoint based on Course:readAll permission
    const source$ = this.canReadAllCourses
      ? this.courseService.getAllCourses()
      : this.courseService.getCourses();

    source$.subscribe({
      next: (data) => {
        this.courses = data;
        this.filteredCourses = [...data];
        this.isLoading = false;
      },
      error: () => {
        this.loadFailed = true;
        this.isLoading = false;
      },
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  applyFilters(): void {
    let temp = this.courses;

    if (this.selectedSemester) {
      temp = temp.filter(c => c.semster === this.selectedSemester);
    }

    if (this.searchTerm) {
      const lowerTerm = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(c => 
        c.Title.toLowerCase().includes(lowerTerm) || 
        c.Id.toString().includes(lowerTerm)
      );
    }

    this.filteredCourses = temp;
  }

  // ── Toggle Status (T015) ──────────────────────────────────────────────────

  toggleStatus(course: Course): void {
    // Optimistic update
    course.IsPublished = !course.IsPublished;

    this.courseService.toggleCourseStatus(course.Id).subscribe({
      error: () => {
        // Revert on failure
        course.IsPublished = !course.IsPublished;
        Swal.fire({
          icon: 'error',
          title: 'Toggle Failed',
          text: 'Could not update the course status. Please try again.',
          confirmButtonColor: '#41B3E3',
        });
      },
    });
  }

  // ── Delete (T018) ─────────────────────────────────────────────────────────

  removeCourse(id: number): void {
    Swal.fire({
      title: 'Delete Course?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E63946',
      cancelButtonColor: '#41B3E3',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.courseService.deleteCourse(id).subscribe({
          next: () => {
            this.courses = this.courses.filter((c) => c.Id !== id);
            this.applyFilters();
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: 'Course has been removed.',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: 'Could not remove the course. Please try again.',
              confirmButtonColor: '#41B3E3',
            });
          },
        });
      }
    });
  }

  // ── Modal: Open / Close (T014) ────────────────────────────────────────────

  openModal(): void {
    const el = document.getElementById('courseModal');
    if (!el) return;
    
    // Check if an instance already exists to avoid memory leaks and duplicate event listeners
    let modal = (window as any).bootstrap.Modal.getInstance(el);
    if (!modal) {
      modal = new (window as any).bootstrap.Modal(el, { backdrop: 'static', keyboard: false });
    }
    this.modalInstance = modal;
    this.modalInstance.show();
  }

  closeModal(): void {
    this.modalInstance?.hide();
  }

  // ── Create / Edit triggers (T015, T028) ───────────────────────────────────

  navigateToCreate(): void {
    this.selectedCourse = null;
    if (this.addEditComponent) {
      this.addEditComponent.courseData = null;
      this.addEditComponent.form?.reset();
      this.addEditComponent.clearImage();
    }
    this.openModal();
  }

  editCourse(course: Course): void {
    this.selectedCourse = course;
    if (this.addEditComponent) {
      this.addEditComponent.courseData = course;
      this.addEditComponent.patchForm(course);
    }
    this.openModal();
  }

  // ── In-place state handlers (T019, T026) ──────────────────────────────────

  onCourseCreated(newCourse: Course): void {
    // Reset filters so the new card is visible at the top
    this.searchTerm = '';
    this.selectedSemester = '';
    this.courses.unshift(newCourse);
    this.applyFilters();
  }

  onCourseUpdated(updatedCourse: Course): void {
    const idx = this.courses.findIndex(c => c.Id === updatedCourse.Id);
    if (idx !== -1) {
      this.courses[idx] = updatedCourse;
      this.applyFilters();
    }
  }

  // ── Navigation (remaining routes) ─────────────────────────────────────────

  // ── Assessment Modal ────────────────────────────────────────────────────

  openAssessmentModal(course: Course): void {
    this.selectedCourse = course;
    // Initialize the Bootstrap modal for the assessment dialog
    const el = document.getElementById('assessmentModal');
    if (!el) return;
    let modal = (window as any).bootstrap.Modal.getInstance(el);
    if (!modal) {
      modal = new (window as any).bootstrap.Modal(el, { backdrop: 'static', keyboard: false });
    }
    modal.show();
    // Trigger data load in the child component — pass values directly
    // to avoid relying on @Input binding propagation timing
    if (this.assessmentComponent) {
      this.assessmentComponent.open(course.Id, course.Title);
    }
  }

  openEnrollmentModal(course: Course): void {
    this.selectedCourse = course;
    const el = document.getElementById('enrollmentModal');
    if (!el) return;
    let modal = (window as any).bootstrap.Modal.getInstance(el);
    if (!modal) {
      modal = new (window as any).bootstrap.Modal(el, { backdrop: 'static', keyboard: false });
    }
    modal.show();
    if (this.enrollmentComponent) {
      this.enrollmentComponent.open(course.Id, course.Title);
    }
  }

  // ── Image Error Fallback (T013) ───────────────────────────────────────────

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const wrapper = img.closest('.course-img-wrapper');
    if (wrapper) {
      const placeholder = wrapper.querySelector('.img-placeholder') as HTMLElement;
      if (placeholder) placeholder.style.display = 'flex';
    }
  }
  // ── Navigation ────────────────────────────────────────────────────────────

  navigateToContent(course: Course): void {
    if (this.canReadCourse) {
      this.router.navigate(['/dashboard/courses', course.Id, 'content'], {
        state: { courseDetails: course }
      });
    }
  }
}
