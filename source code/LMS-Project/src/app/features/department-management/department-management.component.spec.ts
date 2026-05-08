import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentManagementComponent } from './department-management.component';

describe('DepartmentManagementComponent', () => {
  let component: DepartmentManagementComponent;
  let fixture: ComponentFixture<DepartmentManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
