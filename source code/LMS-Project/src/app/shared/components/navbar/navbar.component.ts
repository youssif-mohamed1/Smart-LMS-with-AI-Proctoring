import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  activeSection: string = 'home';
  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // When navigation ends, if there's a fragment, scroll to it
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const urlPath = this.router.url.split('?')[0].split('#')[0];
        const frag = this.route.snapshot.fragment;
        if (urlPath === '/' || urlPath === '') {
          if (frag) {
            // Timeout ensures DOM is ready when landing page loads
            setTimeout(() => this.scrollToFragment(frag), 50);
            setTimeout(() => this.updateActiveOnScroll(), 120);
          } else {
            // No fragment: ensure we land exactly at top (use small timeout to wait for DOM)
            setTimeout(() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
              this.updateActiveOnScroll();
            }, 50);
          }
        } else {
          // if navigating away from landing (e.g., /login), clear active highlight
          this.activeSection = '';
        }
      });
    // initial check
    setTimeout(() => this.updateActiveOnScroll(), 100);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  navigateTo(section: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    // If already on landing (root), just scroll; otherwise navigate with fragment
    const currentPath = this.router.url.split('#')[0];
    if (currentPath === '/' || currentPath === '') {
      if (section === 'home') {
        // Jump to absolute top with no offset or animation
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        this.activeSection = 'home';
      } else {
        this.scrollToFragment(section);
        this.activeSection = section;
      }
    } else {
      if (section === 'home') {
        // navigate to root; on landing init we'll ensure scrollTop=0
        this.router.navigate(['/']);
      } else {
        this.router.navigate(['/'], { fragment: section });
      }
    }
  }

  private scrollToFragment(section: string) {
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updateActiveOnScroll();
  }

  updateActiveOnScroll() {
    // only update when on landing (root path)
    const urlPath = this.router.url.split('?')[0].split('#')[0];
    if (!(urlPath === '/' || urlPath === '')) {
      this.activeSection = '';
      return;
    }
    const sections = ['home', 'about', 'contact'];
    const offset = window.scrollY + window.innerHeight / 3;
    let found = 'home';
    for (const s of sections) {
      const el = document.getElementById(s);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (offset >= top && offset < top + height) {
          found = s;
          break;
        }
      }
    }
    this.activeSection = found;
  }

  isActive(section: string) {
    return this.activeSection === section;
  }
}
