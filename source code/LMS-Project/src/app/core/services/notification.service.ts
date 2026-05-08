import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationBoxResponse {
  id: number;
  unreadCount: number;
  notifications: NotificationResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<NotificationResponse[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private apiUrl = 'https://localhost:7289/api/notification';

  constructor(private http: HttpClient) {}

  fetchNotifications(): Observable<NotificationBoxResponse> {
    return this.http.get<NotificationBoxResponse>(this.apiUrl).pipe(
      tap((res) => {
        this.unreadCountSubject.next(res.unreadCount);
        this.notificationsSubject.next(res.notifications);
      })
    );
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const index = currentNotifications.findIndex(n => n.id === notificationId);
        if (index > -1 && !currentNotifications[index].isRead) {
          const updatedNotifications = [...currentNotifications];
          updatedNotifications[index] = { ...updatedNotifications[index], isRead: true };
          this.notificationsSubject.next(updatedNotifications);
          this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
        }
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(currentNotifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const notification = currentNotifications.find(n => n.id === notificationId);
        if (notification) {
          const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
          this.notificationsSubject.next(updatedNotifications);
          if (!notification.isRead) {
            this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
          }
        }
      })
    );
  }
}
