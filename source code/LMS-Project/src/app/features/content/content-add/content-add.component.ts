import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import Swal from 'sweetalert2';

import { ContentService } from '../../../core/services/content.service';
import { Content, StagedFile } from '../../../models/content';

@Component({
  selector: 'app-content-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content-add.component.html',
  styleUrls: ['./content-add.component.css'],
})
export class ContentAddComponent { // Triggers Angular file watcher
  @Input() courseId!: number;
  @Output() contentCreated = new EventEmitter<Content>();
  @Output() modalDismissed = new EventEmitter<void>();

  // ── Form State ─────────────────────────────────────────────────────────────
  @ViewChild('titleInput') titleInput?: NgModel;
  @ViewChild('bodyInput') bodyInput?: NgModel;

  title = '';
  body  = '';
  stagedFiles: StagedFile[] = [];

  // ── Submission State ───────────────────────────────────────────────────────
  isSubmitting    = false;
  submitError     = '';
  retryMode       = false;
  createdContentId: number | null = null;

  constructor(private contentService: ContentService) {}

  // ── File Selection ─────────────────────────────────────────────────────────

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      const allowed = file.type === 'application/pdf' || file.type === 'video/mp4';
      const withinSize = file.size <= 524_288_000; // 500 MB

      if (!allowed) return; // silently discard unsupported types
      if (!withinSize) {
        // Inform the user per-file; do not add it
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          icon: 'warning',
          title: `"${file.name}" exceeds 500 MB and was not added.`,
          showConfirmButton: false,
          timer: 4000,
        });
        return;
      }

      this.stagedFiles.push({ file, name: file.name, size: file.size, mimeType: file.type });
    });

    // Reset input so re-selecting the same file fires the change event again
    input.value = '';
  }

  removeFile(index: number): void {
    this.stagedFiles.splice(index, 1);
  }

  formatSize(bytes: number): string {
    if (bytes < 1_024)       return `${bytes} B`;
    if (bytes < 1_048_576)   return `${(bytes / 1_024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  getFileIcon(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'bi bi-file-earmark-pdf-fill file-icon-pdf';
    if (mimeType === 'video/mp4')       return 'bi bi-play-circle-fill file-icon-video';
    return 'bi bi-file-earmark-fill';
  }

  // ── Submission Flow ────────────────────────────────────────────────────────

  submit(titleInput?: NgModel, bodyInput?: NgModel): void {
    // Mark as touched so validation errors show if the user clicks Save directly
    if (titleInput) titleInput.control.markAsTouched();
    if (bodyInput) bodyInput.control.markAsTouched();

    if (!this.title.trim() || !this.body.trim()) return;

    this.isSubmitting = true;
    this.submitError  = '';

    this.contentService.createContent(this.courseId, this.title.trim(), this.body.trim()).subscribe({
      next: (created) => {
        this.createdContentId = created.id;

        if (this.stagedFiles.length === 0) {
          // No attachments — done after Step 1
          this.emitSuccess(created);
        } else {
          this.addAttachmentsStep(created.id);
        }
      },
      error: (err) => {
        this.submitError = err?.error?.message || 'Failed to create content. Please try again.';
        this.isSubmitting = false;
      },
    });
  }

  addAttachmentsStep(contentId: number): void {
    const files = this.stagedFiles.map(sf => sf.file);

    this.contentService.addAttachments(contentId, files).subscribe({
      next: (updated) => {
        this.emitSuccess(updated);
      },
      error: (err) => {
        this.retryMode   = true;
        this.submitError = err?.error?.message || 'Files could not be uploaded. You can retry the upload below.';
        this.isSubmitting = false;
      },
    });
  }

  retryUpload(): void {
    if (!this.createdContentId || !this.retryMode) return;
    this.isSubmitting = true;
    this.submitError  = '';
    this.retryMode    = false;
    this.addAttachmentsStep(this.createdContentId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private emitSuccess(item: Content): void {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon: 'success',
      title: 'Content created successfully.',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    this.contentCreated.emit(item);
    this.resetForm();
  }

  resetForm(): void {
    this.title           = '';
    this.body            = '';
    this.stagedFiles     = [];
    this.isSubmitting    = false;
    this.submitError     = '';
    this.retryMode       = false;
    this.createdContentId = null;
    
    // Clear the "touched" validation state so errors don't appear when reopened
    this.titleInput?.control?.markAsUntouched();
    this.bodyInput?.control?.markAsUntouched();
  }

  cancel(): void {
    this.resetForm();
    this.modalDismissed.emit();
  }
}
