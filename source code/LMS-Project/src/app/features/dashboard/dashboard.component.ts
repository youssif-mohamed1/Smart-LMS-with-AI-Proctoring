import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // مهم عشان ngClass
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { UserProfileService } from '../../core/services/user-profile.service';
import { RouterModule, RouterOutlet } from '@angular/router';
import { PermissionService } from '../../core/services/permission.service';
import { NotificationComponent } from '../notification/notification.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, UserProfileComponent, RouterModule, NotificationComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  userProfile: any;
  isProfileOpen = false;   // controls profile drawer
  isSidebarOpen = false;   // controls mobile sidebar drawer

  constructor(
    private userProfileService: UserProfileService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit() {
    // أول ما الصفحة تفتح بنجيب البيانات الحقيقية من الباكيند
    this.userProfileService.getProfile().subscribe({
      next: (data) => {
        this.userProfile = data; // هنا الـ userProfile هيبقى فيه الـ profilePictureUrl
      },
      error: (err) => console.error('Failed to load profile', err),
    });
  }

  toggleProfile() {
    this.isProfileOpen = !this.isProfileOpen;
  }

  // فنكشن التأكد من الصلاحية
  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
}
