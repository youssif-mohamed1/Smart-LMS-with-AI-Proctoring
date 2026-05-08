import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import Swal from 'sweetalert2';

import { CourseService } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';
import { PermissionService } from '../../../core/services/permission.service';
import { EnrolledUser } from '../../../models/enrolled-user';
import { User } from '../../../models/user';

@Component({
  selector: 'app-course-enrollment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl:'./course-enrollment.component.html',
  styleUrls: ['./course-enrollment.component.css'],
})
export class CourseEnrollmentComponent {

  // ── Context ────────────────────────────────────────────────────────────────
  courseId!: number;
  courseName = '';

  // ── Data State ─────────────────────────────────────────────────────────────
  enrolledUsers: EnrolledUser[] = [];
  allInstructors: User[] = [];

  // ── UI State ───────────────────────────────────────────────────────────────
  selectedUserId: string | null = null;
  confirmingUnenrollId: string | null = null;

  isLoading = false;
  loadError = '';
  enrollError = '';
  unenrollError = '';

  // ── Permissions ────────────────────────────────────────────────────────────
  canEnroll = false;
  canUnenroll = false;

  constructor(
    private courseService: CourseService,
    private userService: UserService,
    private permissionService: PermissionService,
  ) {}

  // ── Entry Point ────────────────────────────────────────────────────────────

  open(courseId: number, courseName: string): void {
    this.courseId = courseId;
    this.courseName = courseName;
    this.isLoading = true;
    this.loadError = '';
    this.enrollError = '';
    this.unenrollError = '';
    this.confirmingUnenrollId = null;
    this.selectedUserId = null;

    this.canEnroll = this.permissionService.hasPermission('Course:enrollInstructor');
    this.canUnenroll = this.permissionService.hasPermission('Course:unenrollInstructor');

    const usersReq = this.canEnroll ? this.userService.getUsers() : of([]);

    forkJoin({
      enrolled: this.courseService.getEnrolledUsers(courseId),
      users: usersReq,
    }).subscribe({
      next: ({ enrolled, users }) => {
        this.enrolledUsers = enrolled;
        this.allInstructors = users.filter(
          u => u.roles.some(r => r.toLowerCase() === 'instructor')
        );
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Failed to load enrollment data. Please try again.';
        this.isLoading = false;
      },
    });
  }

  // ── Derived: Available Instructors (excludes already enrolled) ──────────────

  get availableInstructors(): User[] {
    const enrolledIds = new Set(this.enrolledUsers.map(u => u.id));
    return this.allInstructors.filter(u => !enrolledIds.has(u.id));
  }

  // ── Initials Helper ────────────────────────────────────────────────────────

  getInitials(user: EnrolledUser): string {
    return (
      (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')
    ).toUpperCase();
  }

  // ── Enroll ─────────────────────────────────────────────────────────────────

  onEnroll(): void {
    if (!this.selectedUserId) return;
    this.enrollError = '';

    const userId = this.selectedUserId;
    this.courseService.enrollUser(this.courseId, userId).subscribe({
      next: () => {
        const user = this.allInstructors.find(u => u.id === userId);
        if (user) {
          this.enrolledUsers = [
            ...this.enrolledUsers,
            { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
          ];
        }
        this.selectedUserId = null;
        Swal.fire({
          toast: true, position: 'bottom-end', icon: 'success',
          title: 'Instructor enrolled successfully.',
          showConfirmButton: false, timer: 3000,
        });
      },
      error: () => {
        this.enrollError = 'Failed to enroll instructor. Please try again.';
      },
    });
  }

  // ── Unenroll ───────────────────────────────────────────────────────────────

  requestUnenroll(userId: string): void {
    this.confirmingUnenrollId = userId;
    this.unenrollError = '';
  }

  cancelUnenroll(): void {
    this.confirmingUnenrollId = null;
  }

  confirmUnenroll(): void {
    if (!this.confirmingUnenrollId) return;
    this.unenrollError = '';
    const userId = this.confirmingUnenrollId;

    this.courseService.unenrollUser(this.courseId, userId).subscribe({
      next: () => {
        this.enrolledUsers = this.enrolledUsers.filter(u => u.id !== userId);
        this.confirmingUnenrollId = null;
        Swal.fire({
          toast: true, position: 'bottom-end', icon: 'success',
          title: 'Instructor unenrolled successfully.',
          showConfirmButton: false, timer: 3000,
        });
      },
      error: () => {
        this.unenrollError = 'Failed to unenroll instructor. Please try again.';
        this.confirmingUnenrollId = null;
      },
    });
  }
}
