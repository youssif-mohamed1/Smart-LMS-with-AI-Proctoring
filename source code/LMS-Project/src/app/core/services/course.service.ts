import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Course } from '../../models/course';
import { Assessment, AssessmentType } from '../../models/assessment';
import { EnrolledUser } from '../../models/enrolled-user';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private baseUrl = 'https://localhost:7289/api/Course';

  constructor(private http: HttpClient) {}

  /**
   * 1. Get courses scoped to the user's department.
   * Permission: Course:read
   * GET /api/Course
   */
  getCourses(): Observable<Course[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(courses => courses.map(this.normalizeCourse))
    );
  }

  /**
   * 2. Get all courses across all departments (admin).
   * Permission: Course:readAll
   * GET /api/Course/All
   */
  getAllCourses(): Observable<Course[]> {
    return this.http.get<any[]>(`${this.baseUrl}/All`).pipe(
      map(courses => courses.map(this.normalizeCourse))
    );
  }

  /**
   * 3. Create a new course under a department.
   * Permission: Course:add
   * POST /api/Course/{departmentId}
   * ⚠️ Do NOT set Content-Type — browser auto-sets multipart/form-data + boundary.
   */
  createCourse(departmentId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${departmentId}`, formData, { responseType: 'text' });
  }

  /**
   * 4. Update an existing course.
   * Permission: Course:update
   * PUT /api/Course/{id}
   * ⚠️ Do NOT set Content-Type manually.
   */
  updateCourse(courseId: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/${courseId}`, formData, { responseType: 'text' });
  }

  /**
   * Normalizes the course object to handle inconsistencies in the backend API
   * where some endpoints return camelCase and others return PascalCase.
   */
  private normalizeCourse(c: any): Course {
    return {
      Id: c.id !== undefined ? c.id : c.Id,
      Title: c.title !== undefined ? c.title : c.Title,
      Description: c.description !== undefined ? c.description : c.Description,
      ImageUrl: c.imageUrl !== undefined ? c.imageUrl : c.ImageUrl,
      semster: c.semster !== undefined ? c.semster : c.Semster,
      Credit_Hour: c.credit_Hour !== undefined ? c.credit_Hour : c.Credit_Hour,
      IsPublished: c.isPublished !== undefined ? c.isPublished : c.IsPublished,
      LearningOutcomes: c.learningOutcomes ?? c.LearningOutcomes ?? '',
      academicLevel: c.academicLevel ?? c.AcademicLevel ?? undefined,
      departmentId: c.departmentId ?? c.DepartmentId ?? undefined,
    };
  }

  /**
   * 5. Toggle published/draft status of a course.
   * Permission: Course:update
   * PUT /api/Course/{id}/Toggle_Status
   */
  toggleCourseStatus(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/Toggle_Status`, {});
  }

  /**
   * 6. Soft-delete a course.
   * Permission: Course:delete
   * DELETE /api/Course/{id}
   */
  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ── Assessment Endpoints ──────────────────────────────────────────────────

  private normalizeAssessment(a: any): Assessment {
    return {
      assType: a.assType ?? a.AssType ?? a.asstype ?? 0,
      percentageWeight: a.percentageWeight ?? a.PercentageWeight ?? 0,
      isMandatory: a.isMandatory ?? a.IsMandatory ?? false,
      hours: a.hours ?? a.Hours ?? 0,
    };
  }

  private normalizeAssessmentType(t: any): AssessmentType {
    return {
      value: t.value ?? t.Value ?? 0,
      name: t.name ?? t.Name ?? '',
    };
  }

  /**
   * 7. Get all assessments for a course.
   * Permission: Course:read / Course:readAll
   * GET /api/Course/{courseId}/assessments
   */
  getCourseAssessments(courseId: number): Observable<Assessment[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${courseId}/assessments`).pipe(
      map(list => list.map(a => this.normalizeAssessment(a)))
    );
  }

  /**
   * 8. Get all available assessment types.
   * GET /api/Course/assessment-types
   */
  getAssessmentTypes(): Observable<AssessmentType[]> {
    return this.http.get<any[]>(`${this.baseUrl}/assessment-types`).pipe(
      map(list => list.map(t => this.normalizeAssessmentType(t)))
    );
  }

  /**
   * 9. Add assessments to a course.
   * POST /api/Course/{courseId}/AddAssesment
   */
  addAssessment(courseId: number, assessments: Assessment[]): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${courseId}/AddAssesment`,
      assessments,
      { responseType: 'text' }
    );
  }

  /**
   * 10. Update assessments on a course (Overwrites existing list).
   * PUT /api/Course/{courseId}/UpdateAssesment
   */
  updateAssessment(courseId: number, assessments: Assessment[]): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${courseId}/UpdateAssesment`,
      assessments,
      { responseType: 'text' }
    );
  }

  // ── Enrollment Endpoints ──────────────────────────────────────────────────

  private normalizeEnrolledUser(u: any): EnrolledUser {
    if (typeof u === 'string') {
      return { id: u, firstName: '', lastName: '', email: '' };
    }

    // The API returns an enrollment record (userId, userName, userEmail)
    const id = u.userId ?? u.UserId ?? u.id ?? u.Id;
    
    let firstName = u.firstName ?? u.FirstName ?? '';
    let lastName = u.lastName ?? u.LastName ?? '';
    
    const fullName = u.userName ?? u.UserName ?? u.name ?? u.Name;
    if (fullName && !firstName && !lastName) {
      const parts = fullName.split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }
    
    const email = u.userEmail ?? u.UserEmail ?? u.email ?? u.Email ?? '';

    return { id, firstName, lastName, email };
  }

  /**
   * Get all instructors enrolled in a course.
   * Permission: Course:read / Course:readAll
   * GET /api/Course/{courseId}/users
   */
  getEnrolledUsers(courseId: number): Observable<EnrolledUser[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${courseId}/users`).pipe(
      map(list => list.map(u => this.normalizeEnrolledUser(u)))
    );
  }

  /**
   * Enroll an instructor in a course.
   * Permission: Course:enrollInstructor
   * POST /api/Course/{courseId}/users
   */
  enrollUser(courseId: number, userId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${courseId}/users`,
      { userId },
      { responseType: 'text' }
    );
  }

  /**
   * Unenroll an instructor from a course.
   * Permission: Course:unenrollInstructor
   * DELETE /api/Course/{courseId}/users/{userId}
   */
  unenrollUser(courseId: number, userId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/${courseId}/users/${userId}`,
      { responseType: 'text' }
    );
  }
}
