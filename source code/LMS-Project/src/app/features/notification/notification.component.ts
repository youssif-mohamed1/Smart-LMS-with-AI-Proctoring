import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationResponse } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: NotificationResponse[] = [];
  isDropdownOpen = false;
  expandedItems: Set<number> = new Set();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => this.unreadCount = count)
    );
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifs => this.notifications = notifs)
    );

    this.notificationService.fetchNotifications().subscribe({
      error: (err) => console.error('Failed to fetch notifications', err)
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  toggleExpand(notification: NotificationResponse, event: Event): void {
    event.stopPropagation();
    if (this.expandedItems.has(notification.id)) {
      this.expandedItems.delete(notification.id);
    } else {
      this.expandedItems.add(notification.id);
      if (!notification.isRead) {
        this.notificationService.markAsRead(notification.id).subscribe({
          error: (err) => console.error('Failed to mark as read', err)
        });
      }
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe({
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  deleteNotification(notificationId: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notificationId).subscribe({
      error: (err) => console.error('Failed to delete notification', err)
    });
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `Just now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  }
}
