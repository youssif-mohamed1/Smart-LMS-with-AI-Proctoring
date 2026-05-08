import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private baseUrl = 'https://localhost:7289/me'; // الـ Base URL من الـ PDF [cite: 4]

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}`).pipe(
      map(u => ({
        email: u.email ?? u.Email,
        firstName: u.firstName ?? u.FirstName,
        lastName: u.lastName ?? u.LastName,
        academicYear: u.academicYear ?? u.AcademicYear,
        profilePictureUrl: u.profilePictureUrl ?? u.ProfilePictureUrl,
        dateOfBirth: u.dateOfBirth ?? u.DateOfBirth,
      }))
    );
  }

  updateProfile(formData: FormData) {
    return this.http.put(`${this.baseUrl}/info`, formData);
  }

  changePassword(data: any) {
    return this.http.put(`${this.baseUrl}/change-password`, data);
  }

  levelUp() {
    return this.http.put(`${this.baseUrl}/LevelUp`, {});
  }
}
