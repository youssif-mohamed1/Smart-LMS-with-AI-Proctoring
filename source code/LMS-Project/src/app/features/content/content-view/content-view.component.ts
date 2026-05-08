import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { ContentService } from '../../../core/services/content.service';
import { CourseService } from '../../../core/services/course.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Content } from '../../../models/content';
import { Course } from '../../../models/course';
import { ContentAddComponent } from '../content-add/content-add.component';

@Component({
  selector: 'app-content-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentAddComponent ],
  templateUrl: './content-view.component.html',
  styleUrls: ['./content-view.component.css'],
})
export class ContentViewComponent implements OnInit {
  courseId!: number;
  courseDetails?: Course;
  contentList: Content[] = [];
  isLoading = false;
  loadError = '';

  // Card state
  expandedIds = new Set<number>();
  editingIds  = new Set<number>();
  editFormData = new Map<number, { title: string; body: string }>();

  // Permission flags
  canRead   = false;
  canUpdate = false;
  canDelete = false;
  canAdd    = false;

  constructor(
    private route:             ActivatedRoute,
    private router:            Router,
    private contentService:    ContentService,
    private courseService:     CourseService,
    private permissionService: PermissionService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['courseDetails']) {
      this.courseDetails = navigation.extras.state['courseDetails'];
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.courseId  = Number(this.route.snapshot.paramMap.get('courseId'));
    this.canRead   = this.permissionService.hasPermission('Content:read');
    this.canUpdate = this.permissionService.hasPermission('Content:update');
    this.canDelete = this.permissionService.hasPermission('Content:delete');
    this.canAdd    = this.permissionService.hasPermission('Content:add');
    if (this.canRead) {
      this.loadContent();
      if (!this.courseDetails) {
        this.loadCourseDetails();
      }
    }
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  loadContent(): void {
    this.isLoading = true;
    this.loadError = '';
    this.contentService.getContentByCourse(this.courseId).subscribe({
      next: (list) => {
        this.contentList = list;
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.contentList = [];
        } else {
          this.loadError = 'Failed to load content. Please try again.';
        }
        this.isLoading = false;
      },
    });
  }

  loadCourseDetails(): void {
    const courses$ = this.permissionService.hasPermission('Course:readAll') 
      ? this.courseService.getAllCourses() 
      : this.courseService.getCourses();

    courses$.subscribe({
      next: (courses) => {
        this.courseDetails = courses.find(c => Number(c.Id) === this.courseId) || courses.find(c => c.Id === this.courseId);
      },
      error: (err) => {
        console.error('Failed to load course details', err);
      }
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/dashboard/courses']);
  }

  // ── Expansion ─────────────────────────────────────────────────────────────

  toggleExpand(id: number): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedIds.has(id);
  }

  // ── Attachment Handling ───────────────────────────────────────────────────

  openAttachment(fileUrl: string): void {
    window.open(fileUrl, '_blank');
  }

  getAttachmentIcon(contentType: string): string {
    if (contentType?.startsWith('video/')) {
      return 'bi bi-play-circle-fill';
    }
    if (contentType === 'application/pdf') {
      return 'bi bi-file-earmark-pdf-fill';
    }
    return 'bi bi-file-earmark-fill';
  }

  // ── Inline Edit ───────────────────────────────────────────────────────────

  startEdit(item: Content): void {
    this.expandedIds.delete(item.id); // collapse attachments while editing
    this.editFormData.set(item.id, { title: item.title, body: item.body });
    this.editingIds.add(item.id);
  }

  cancelEdit(id: number): void {
    // Silently discard — no confirmation dialog (clarified Q2)
    this.editingIds.delete(id);
    this.editFormData.delete(id);
  }

  saveEdit(id: number): void {
    const formData = this.editFormData.get(id);
    if (!formData) return;
    const { title, body } = formData;

    this.contentService.updateContent(id, title, body).subscribe({
      next: () => {
        const item = this.contentList.find(c => c.id === id);
        if (item) {
          item.title = title;
          item.body  = body;
        }
        this.cancelEdit(id);
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          icon: 'success',
          title: 'Content updated successfully.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Could not save changes. Please try again.',
          confirmButtonColor: '#41B3E3',
        });
      },
    });
  }

  // ── Delete Content ────────────────────────────────────────────────────────

  async deleteContent(id: number): Promise<void> {
    const result = await Swal.fire({
      title: 'Delete Content?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E63946',
      cancelButtonColor: '#41B3E3',
      confirmButtonText: 'Yes, delete it',
    });

    if (!result.isConfirmed) return;

    this.contentService.deleteContent(id).subscribe({
      next: () => {
        this.contentList = this.contentList.filter(c => c.id !== id);
        this.expandedIds.delete(id);
        this.editingIds.delete(id);
        this.editFormData.delete(id);
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          icon: 'success',
          title: 'Content deleted.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'Could not delete this content item. Please try again.',
          confirmButtonColor: '#41B3E3',
        });
      },
    });
  }

  // ── Delete Attachment ─────────────────────────────────────────────────────

  async deleteAttachment(contentId: number, attachmentId: string): Promise<void> {
    const result = await Swal.fire({
      title: 'Remove Attachment?',
      text: 'The file will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E63946',
      cancelButtonColor: '#41B3E3',
      confirmButtonText: 'Yes, remove it',
    });

    if (!result.isConfirmed) return;

    this.contentService.deleteAttachment(attachmentId).subscribe({
      next: () => {
        const item = this.contentList.find(c => c.id === contentId);
        if (item) {
          item.contentAttachments = item.contentAttachments.filter(a => a.id !== attachmentId);
        }
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          icon: 'success',
          title: 'Attachment removed.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Remove Failed',
          text: 'Could not remove this attachment. Please try again.',
          confirmButtonColor: '#41B3E3',
        });
      },
    });
  }

  // ── Add Content Modal ─────────────────────────────────────────────────────

  private contentAddModalInstance: any = null;

  onAddContent(): void {
    const el = document.getElementById('contentAddModal');
    if (el) {
      this.contentAddModalInstance = (window as any).bootstrap.Modal.getOrCreateInstance(el);
      this.contentAddModalInstance.show();
    }
  }

  onContentCreated(newItem: Content): void {
    this.contentList = [...this.contentList, newItem];
    this.closeContentModal();
  }

  closeContentModal(): void {
    this.contentAddModalInstance?.hide();
  }
}
