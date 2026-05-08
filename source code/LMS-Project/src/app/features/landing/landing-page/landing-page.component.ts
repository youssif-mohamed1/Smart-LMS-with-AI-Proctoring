import { Component } from '@angular/core';
import { FeaturesListComponent } from '../features-list/features-list.component';
import { HeroComponent } from '../hero/hero.component';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    FeaturesListComponent,
    HeroComponent,
    AboutComponent,
    ContactComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent {}
