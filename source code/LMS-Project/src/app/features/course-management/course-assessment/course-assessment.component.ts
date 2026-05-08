import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { CourseService } from '../../../core/services/course.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Assessment, AssessmentType } from '../../../models/assessment';

@Component({
  selector: 'app-course-assessment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-assessment.component.html',
  styleUrls: ['./course-assessment.component.css'],
})
export class CourseAssessmentComponent {
  @Input() courseId!: number;
  @Input() courseName!: string;

  // ── Data State ────────────────────────────────────────────────────────────
  assessments: Assessment[] = [];
  assessmentTypes: AssessmentType[] = [];
  isLoading = false;
  loadError = '';

  // ── Permission Flags ──────────────────────────────────────────────────────
  canAdd = false;
  canUpdate = false;

  // ── Mode State ────────────────────────────────────────────────────────────
  isEditingMode = false;
  showAddForm = false;

  // ── Forms ─────────────────────────────────────────────────────────────────
  addForm: FormGroup;
  bulkForm: FormGroup;
  addSaveError = '';
  bulkSaveError = '';

  constructor(
    private courseService: CourseService,
    private permissionService: PermissionService,
    private fb: FormBuilder
  ) {
    this.addForm = this.fb.group({
      assType: [null, Validators.required],
      percentageWeight: [null, [Validators.required, Validators.min(0.01)]],
      isMandatory: [false],
      hours: [null, [Validators.required, Validators.min(1)]],
    });

    this.bulkForm = this.fb.group({
      assessmentsArray: this.fb.array([])
    });
  }

  get assessmentsArray(): FormArray {
    return this.bulkForm.get('assessmentsArray') as FormArray;
  }

  // ── Public entry point called by parent ───────────────────────────────────
  open(courseId: number, courseName: string): void {
    this.courseId = courseId;
    this.courseName = courseName;

    this.assessments = [];
    this.assessmentTypes = [];
    this.loadError = '';
    this.addSaveError = '';
    this.bulkSaveError = '';
    this.showAddForm = false;
    this.isEditingMode = false;
    this.isLoading = true;

    this.canAdd = this.permissionService.hasPermission('Course:add');
    this.canUpdate = this.permissionService.hasPermission('Course:update');

    this.loadData();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────
  private loadData(): void {
    forkJoin({
      assessments: this.courseService.getCourseAssessments(this.courseId),
      types: this.courseService.getAssessmentTypes(),
    }).subscribe({
      next: ({ assessments, types }) => {
        this.assessments = assessments;
        this.assessmentTypes = types;
        this.isLoading = false;
        this.populateBulkForm(); // Sync the table view
      },
      error: () => {
        this.loadError = 'Failed to load assessment data. Please try again.';
        this.isLoading = false;
      },
    });
  }
  showAddLimitError = false;

  // ── Mode Toggles ──────────────────────────────────────────────────────────
  toggleAddForm(): void {
    this.showAddLimitError = false; // Reset the error each time

    // Block opening if weight limit reached
    if (!this.showAddForm && this.totalWeight >= 100) {
      this.showAddLimitError = true;
      return;
    }

    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.isEditingMode = false; // Close bulk edit if opening add
      this.addForm.reset({ assType: null, percentageWeight: null, isMandatory: false, hours: null });
      this.addSaveError = '';
      if (this.availableTypes.length === 1) {
        this.addForm.patchValue({ assType: this.availableTypes[0].value });
      }
    }
  }

  toggleEditMode(): void {
    this.isEditingMode = !this.isEditingMode;
    this.showAddLimitError = false; // Hide the add limit error if it was open
    if (this.isEditingMode) {
      this.showAddForm = false; // Close add if opening bulk edit
      this.bulkSaveError = '';
    }
    // Always sync state when entering OR exiting edit mode.
    // Exiting (canceling) will revert any unsaved deletions or modifications.
    this.populateBulkForm();
  }

  private populateBulkForm(): void {
    this.assessmentsArray.clear();
    this.assessments.forEach(a => {
      this.assessmentsArray.push(this.fb.group({
        assType: [a.assType], // Read-only in UI
        percentageWeight: [a.percentageWeight, [Validators.required, Validators.min(0.01)]],
        isMandatory: [a.isMandatory],
        hours: [a.hours, [Validators.required, Validators.min(1)]]
      }));
    });
  }

  // ── Bulk Form Helpers ─────────────────────────────────────────────────────
  removeRow(index: number): void {
    this.assessmentsArray.removeAt(index);
  }

  calculateBulkWeight(): number {
    return (this.assessmentsArray.controls as FormGroup[])
      .reduce((sum, ctrl) => sum + (ctrl.value.percentageWeight || 0), 0);
  }

  getFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  // ── Save Actions ──────────────────────────────────────────────────────────
  onAddSave(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const weight = this.addForm.value.percentageWeight;
    if (this.totalWeight + weight > 100) {
      this.addSaveError = 'Total course weight cannot exceed 100%.';
      return;
    }

    const newAssessment: Assessment = {
      assType: +this.addForm.value.assType,
      percentageWeight: +weight,
      isMandatory: !!this.addForm.value.isMandatory,
      hours: +this.addForm.value.hours,
    };

    this.courseService.addAssessment(this.courseId, [newAssessment]).subscribe({
      next: () => {
        this.assessments = [...this.assessments, newAssessment];
        this.populateBulkForm(); // Sync the table view with the new item
        this.toggleAddForm();
      },
      error: () => this.addSaveError = 'Failed to save. Try again.'
    });
  }

  onSaveBulk(): void {
    if (this.bulkForm.invalid) {
      this.bulkForm.markAllAsTouched();
      return;
    }
    const total = this.calculateBulkWeight();
    if (total > 100) {
      this.bulkSaveError = 'Total weight cannot exceed 100%.';
      return;
    }

    const payload: Assessment[] = this.assessmentsArray.controls.map((ctrl: any) => {
      const v = ctrl.getRawValue();
      
      // Robustly determine the numeric ID for assType. 
      // If v.assType is the string name (e.g., "Final"), reverse-lookup the ID.
      let numericAssType = 0;
      if (v.assType != null) {
        const strVal = String(v.assType).trim();
        const matchedType = this.assessmentTypes.find(
          t => String(t.value) === strVal || t.name.toLowerCase() === strVal.toLowerCase()
        );
        numericAssType = matchedType ? matchedType.value : (isNaN(+v.assType) ? 0 : +v.assType);
      }

      return {
        assType: numericAssType,
        percentageWeight: +v.percentageWeight,
        isMandatory: !!v.isMandatory,
        hours: +v.hours
      };
    });

    this.courseService.updateAssessment(this.courseId, payload).subscribe({
      next: () => {
        this.assessments = payload;
        this.isEditingMode = false;
        this.populateBulkForm(); // Sync back to ensure form state is clean
      },
      error: () => this.bulkSaveError = 'Failed to update list. Try again.'
    });
  }

  // ── Getters & Helpers ─────────────────────────────────────────────────────
  get totalWeight(): number {
    return this.assessments.reduce((sum, a) => sum + a.percentageWeight, 0);
  }

  get availableTypes(): AssessmentType[] {
    return this.assessmentTypes;
  }

  getTypeName(assType: number): string {
    return this.assessmentTypes.find(t => t.value === assType)?.name ?? String(assType);
  }
}
