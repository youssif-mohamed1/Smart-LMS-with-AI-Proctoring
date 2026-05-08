import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'LMS-Project';
  private sub?: Subscription;
  showFooter = true;
  showNavbar = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const urlTree = this.router.parseUrl(e.urlAfterRedirects || e.url);
        // If navigation has no fragment, ensure we start at top of page
        if (!urlTree.fragment) {
          // give Angular a tick to render, then jump to top
          setTimeout(
            () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }),
            0,
          );
        }
        // hide footer on auth pages (login/register)
        const primary = urlTree.root.children['primary'];
        const path = primary?.segments.map((s) => s.path).join('/') ?? '';
        this.showFooter = !(
          path === 'login' ||
          path === 'register' ||
          path === 'forget-password' ||
          path === 'Auth/emailConfrimation' ||
          path === 'auth/forgetPassword' ||
          path === 'dashboard' ||
          path === 'dashboard/roles' ||
          path === 'dashboard/users' ||
          path === 'dashboard/departments' ||
          path === 'dashboard/courses' ||
          (path.startsWith('dashboard/courses/') && path.endsWith('/content'))
        );
        this.showNavbar = !(
          path === 'login' ||
          path === 'register' ||
          path === 'forget-password' ||
          path === 'Auth/emailConfrimation' ||
          path === 'auth/forgetPassword' ||
          path === 'dashboard' ||
          path === 'dashboard/roles' ||
          path === 'dashboard/users' ||
          path === 'dashboard/departments' ||
          path === 'dashboard/courses' ||
          (path.startsWith('dashboard/courses/') && path.endsWith('/content'))
        );
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
