# Lumina LMS — Design System Reference
> Pass this file to Stitch to generate new pages that match the existing Lumina theme exactly.

---

## 1. Brand Identity

| Property | Value |
|----------|-------|
| **Product Name** | Lumina LMS |
| **Tagline** | "Illuminating Education, Intelligently Secured" |
| **Personality** | Professional · Trustworthy · Modern · Clean |
| **UI Style** | Dark navy sidebar + light content area · Glassmorphism on auth pages · Data-table-heavy admin panel |

---

## 2. Color Palette

These are the exact CSS custom properties used across the project (`--lms-*` and `--lumina-*`).

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--lumina-info` / `--lms-primary` | `#41B3E3` | Primary accent — buttons, links, active states, badge highlights, borders |
| `--lumina-blue` / `--lms-dark` | `#002D5B` | Dark navy — sidebar, card headers, gradient endpoints |
| `--lms-hover` | `#3599C4` | Hover state for primary actions |
| Deepest Navy | `#001A33` | Sidebar gradient start, table header background |
| Deepest Dark | `#001529` | Auth page gradient start |

### Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--lms-bg-light` | `#F4F9FC` | Page/content area background |
| White | `#FFFFFF` | Cards, table rows, drawers |
| Glassmorphism | `rgba(255,255,255,0.05)` | Auth page card background |

### Semantic / State Colors

| Purpose | Hex | Usage |
|---------|-----|-------|
| **Active / Enable** | `#2A9D8F` (teal-green) | "Enable" toggle button text & hover fill |
| **Danger / Disable** | `#E63946` | "Disable" toggle button text & hover fill |
| **Error inputs** | `#FF4D4D` | Validation border / feedback text on auth forms |
| **Muted text** | `#6C757D` | Secondary / helper text |
| **Body text** | `#333333` | Table cell text |

### Gradients

| Name | Value | Used on |
|------|-------|---------|
| **Sidebar** | `linear-gradient(180deg, #001A33 0%, #002D5B 100%)` | Left sidebar |
| **Card Header** | `linear-gradient(90deg, #001A33 0%, #002D5B 100%)` | Form / table card header strip |
| **Primary Button** | `linear-gradient(135deg, #41B3E3, #002D5B)` | Main CTA buttons (Create / Save) |
| **Auth Background** | `linear-gradient(-45deg, #001529, #002D5B, #001529, #41B3E3)` | Full-screen auth page background (animated) |
| **Login Button** | `linear-gradient(90deg, #41B3E3, #002D5B)` | Auth form submit button |

---

## 3. Typography

| Property | Value |
|----------|-------|
| **Framework** | Bootstrap 5 (base) |
| **Heading style** | `fw-bold`, `text-info` (`#41B3E3`) or `text-dark` |
| **Page titles** | `<h2 class="text-info">` — e.g., "User Management" |
| **Card header titles** | `<h5>` inside `.card-header`, white/info colored, `letter-spacing: 0.5px` |
| **Table headers** | Uppercase, `font-size: 1rem`, `font-weight: 600`, `letter-spacing: 0.5px` |
| **Table cells** | `font-size: 0.9rem`, color `#333` |
| **Badges / buttons (small)** | `font-size: 0.82rem`, `font-weight: 500–600` |
| **Muted helpers** | `<small class="text-muted">` |

---

## 4. Layout & Spacing

### Dashboard Shell Layout
```
┌─────────────────────────────────────────────┐
│  Navbar (sticky top, white, border-bottom)  │
├───────────────┬─────────────────────────────┤
│  Sidebar      │   Main Content Area         │
│  270px wide   │   flex-grow-1               │
│  Dark navy    │   padding: 1.5rem (p-4)     │
│  gradient     │   background: #F4F9FC       │
└───────────────┴─────────────────────────────┘
```

### Content Page Structure (inside router-outlet)
```
<div class="container mt-4">
  <!-- Page Header: title + primary CTA button -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="text-info">Page Title</h2>
    <button class="btn btn-lumina-main | btn-lumina-outline">...</button>
  </div>

  <!-- Collapsible Form Card (shown on add/edit) -->
  <div class="card shadow-sm mb-4">
    <div class="card-header">...</div>
    <div class="card-body">...</div>
  </div>

  <!-- Data Table Card -->
  <div class="card shadow-sm mb-4">
    <div class="table-container">
      <table class="table table-hover align-middle mb-0">...</table>
    </div>
  </div>

  <!-- Loading Spinner -->
  <div class="text-center my-5">
    <div class="spinner-border text-primary">...</div>
  </div>
</div>
```

---

## 5. Component Specifications

### 5.1 Sidebar
- **Width:** 270px, `min-height: 91.6vh`
- **Background:** `linear-gradient(180deg, #001A33 0%, #002D5B 100%)`
- **Right border:** `1px solid rgba(65, 179, 227, 0.2)`
- **Box shadow:** `4px 0 15px rgba(0,0,0,0.1)`
- **Title ("Lumina Panel"):** color `#41B3E3`, `font-size: 1.15rem`, uppercase, `letter-spacing: 1px`, border-bottom `rgba(255,255,255,0.1)`

#### Nav Links
| State | Style |
|-------|-------|
| Default | `color: rgba(255,255,255,0.7)`, `border-radius: 8px`, `padding: 12px 15px` |
| Hover | `background: rgba(65,179,227,0.15)`, `color: #41B3E3`, `transform: translateX(8px)` |
| Active | `background: #41B3E3`, `color: #001A33`, `font-weight: 600`, `box-shadow: 0 4px 15px rgba(65,179,227,0.4)` |

#### Nav Icons
- `font-size: 1.2rem`, `margin-right: 12px`
- Hover: `transform: scale(1.2) rotate(5deg)`
- Icon library: **Bootstrap Icons** (`bi bi-*`)

---

### 5.2 Top Navbar
- White background, `border-bottom`, sticky
- Contains: circular profile avatar (45×45px, `border: 2px solid #41B3E3`, `border-radius: 50%`) + Brand name `"Lumina "` + accent span `"Dashboard"`
- Click on avatar opens a slide-in profile drawer from the left (400px wide, `cubic-bezier(0.4, 0, 0.2, 1)` transition)

---

### 5.3 Cards
```css
.card {
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}
```

#### Card Header
```css
.card-header {
  background: linear-gradient(90deg, #001A33 0%, #002D5B 100%);
  border-bottom: 1px solid rgba(65,179,227,0.3);
  padding: 15px 20px;
  color: #41B3E3;  /* text-info */
}
```

---

### 5.4 Data Tables

#### Table Container (scrollable)
```css
.table-container {
  max-height: 565px;
  overflow-y: auto;
}
/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #41B3E3; border-radius: 10px; }
```

#### Table Head
```css
thead th {
  background-color: #001A33;
  color: #41B3E3;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 1rem;
  letter-spacing: 0.5px;
  padding: 15px 10px;
  border-bottom: 2px solid #41B3E3;
  position: sticky; top: 0; z-index: 2;
}
```

#### Table Body
```css
tbody td {
  padding: 12px 10px;
  color: #333;
  font-size: 0.9rem;
  border-bottom: 1px solid #eee;
}
tbody tr:hover {
  background-color: rgba(65,179,227,0.05);
}
```

---

### 5.5 Buttons

#### Primary CTA — `.btn-lumina-main`
```css
background: linear-gradient(135deg, #41B3E3, #002D5B);
color: white;
border: none;
border-radius: 8px;
padding: 10px 20px;
font-weight: 600;
box-shadow: 0 4px 12px rgba(65,179,227,0.2);
/* Hover: translateY(-2px), brightness(1.1), stronger shadow */
```

#### Outline / Cancel — `.btn-lumina-outline`
```css
background: transparent;
color: #002D5B;
border: 1.5px solid #002D5B;
border-radius: 8px;
font-weight: 600;
/* Hover: background #002D5B, color white */
```

#### Save/Submit — `.btn-save-action`
```css
background-color: #41B3E3;
color: white;
border: none;
border-radius: 6px;
padding: 8px 25px;
font-weight: 600;
/* Disabled: background #ccc, cursor not-allowed */
```

#### Edit Action — `.btn-edit-action`
```css
color: #41B3E3;
background-color: rgba(65,179,227,0.08);
border: 1px solid #41B3E3;
border-radius: 6px;
padding: 5px 15px;
font-size: 0.82rem;
font-weight: 600;
/* Hover: solid #41B3E3 background, white text, box-shadow */
```

#### Toggle Status Buttons

| Class | Color | Usage |
|-------|-------|-------|
| `.btn-to-disable` | `#E63946` (muted red) | Shown when record is Active → click to Disable |
| `.btn-to-enable` | `#2A9D8F` (teal) | Shown when record is Disabled → click to Enable |

Both share `.btn-status-action`:
```css
padding: 4px 12px;
font-size: 0.82rem;
font-weight: 500;
border-radius: 6px;
transition: all 0.3s ease;
min-width: 85px;
border: 1px solid transparent;
background-color: transparent;
/* Hover fills with solid color + box-shadow */
```

#### Auth Page Button — `.btn-login-grad`
```css
background: linear-gradient(90deg, #41B3E3, #002D5B);
color: white;
border: none;
border-radius: 12px;
font-weight: 600;
/* Hover: translateY(-2px), box-shadow */
```

---

### 5.6 Status Badges — `.status-badge`

Used in table rows to show record status.

```css
.status-badge {
  padding: 5px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-transform: capitalize;
}
```

| Class | Background | Text Color |
|-------|-----------|------------|
| `.status-active` | `rgba(65,179,227,0.12)` | `#3189AD` |
| `.status-disabled` | `rgba(108,117,125,0.1)` | `#6C757D` |

---

### 5.7 Role / Tag Badges
```html
<span class="badge bg-light text-dark me-1 border">Role Name</span>
```
Light background, dark text, thin border — used to display multi-value tags inline.

---

### 5.8 Form Controls

#### Standard (light background)
```css
.form-control:focus, .form-select:focus {
  border-color: #41B3E3;
  box-shadow: 0 0 0 0.25rem rgba(65,179,227,0.2);
}
```
- Labels: `class="form-label fw-bold"`
- Invalid state: `.is-invalid` with Bootstrap's `.invalid-feedback`
- Layout: Bootstrap grid — `row` → `col-md-4 mb-3` per field

#### Auth Page (glassmorphism inputs)
```css
.glass-input {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  border-radius: 12px;
  padding: 12px 15px;
}
.glass-input.is-invalid {
  border-color: #FF4D4D;
  background: rgba(255,77,77,0.1);
  box-shadow: 0 0 10px rgba(255,77,77,0.2);
}
.invalid-feedback { color: #FF4D4D; font-size: 0.8rem; font-weight: 500; }
```
- Use `input-group` with `.glass-input-icon` span for icon prefix on each field.

---

### 5.9 Auth Page Shell (Glassmorphism)

Full-screen animated gradient background + floating frosted-glass card.

```css
.auth-wrapper {
  width: 100%; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(-45deg, #001529, #002D5B, #001529, #41B3E3);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
}

.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 25px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.3);
  max-width: 480px; width: 100%;
  animation: fadeInUp 0.8s ease-out forwards, float 6s ease-in-out infinite 0.8s;
}
```

#### Keyframe animations:
- **`gradientBG`** — shifts background-position 0% → 100% → 0% over 15s (infinite)
- **`fadeInUp`** — `opacity:0, translateY(30px)` → `opacity:1, translateY(0)` over 0.8s
- **`float`** — `translateY(0)` → `translateY(-15px)` → `translateY(0)` over 6s (infinite, starts after 0.8s delay)
- **`pulseGlow`** — opacity 0.8 → 1 → 0.8 over 3s on logo image

---

## 6. Micro-Animations & Transitions

| Element | Animation |
|---------|-----------|
| All interactive elements | `transition: all 0.3s ease` |
| Primary buttons on hover | `translateY(-2px)` + stronger shadow |
| Sidebar nav links on hover | `translateX(8px)` |
| Sidebar icons on hover | `scale(1.2) rotate(5deg)` |
| Cards on hover (landing) | `translateY(-10px)` + shadow |
| Profile drawer open/close | `translateX(-100% → 0)`, `cubic-bezier(0.4, 0, 0.2, 1)`, 0.4s |
| Table rows on hover | Subtle `rgba(65,179,227,0.05)` background fade |
| Auth card | Fade-in + perpetual float |
| Auth background | Slow animated gradient shift |
| Logo on auth page | Pulse glow `drop-shadow(0 0 15px rgba(65,179,227,0.5))` |

---

## 7. Icons

- **Library:** Bootstrap Icons (`bi bi-*`) via CDN or npm
- Common icons in use:

| Icon Class | Usage |
|-----------|-------|
| `bi-people-fill` | Users Management nav link |
| `bi-shield-lock-fill` | Roles Management nav link |
| `bi-plus-lg` | Create button (open form) |
| `bi-x-lg` | Close form button |
| `bi-pencil-square` | Edit action button |
| `bi-envelope` | Email field prefix (auth) |
| `bi-lock` | Password field prefix (auth) |
| `bi-arrow-right` | Login submit button suffix |

---

## 8. Page Patterns & Templates

### 8.1 Standard Admin/Management Page
Use this pattern for any CRUD management page (users, roles, courses, departments, etc.):

1. **Page header row** — title (`h2.text-info`) left, primary action button right
2. **Collapsible create/edit form card** — toggled by the header button; card-header shows context title (Add vs. Edit)
3. **Data table card** — scrollable, sticky dark header, hover rows, action buttons in last column
4. **Loading spinner** — centered, shown while data is fetching

### 8.2 Auth Pages (Login / Register / Forgot Password / Reset Password)
Use this pattern for all authentication-related pages:

1. **Full-viewport animated gradient background** (`.auth-wrapper`)
2. **Centered glassmorphism card** (`.glass-card`) with float animation
3. **Brand name** `"Lumina"` at top center in white bold text + tagline in `text-white-50`
4. **Input groups** with icon prefix, `.glass-input` styling
5. **Gradient submit button** full width (`.btn-login-grad`)
6. **Footer link** — "Don't have an account? Create Account" or vice-versa

### 8.3 Profile / Detail Drawer
A slide-in panel from the left (400px wide):
- Triggered by clicking profile avatar in navbar
- Dark overlay backdrop with `blur(1px)`
- White panel with header bar containing close (`btn-close`) button
- `z-index: 2000` for the drawer, `z-index: 1500` for the overlay

---

## 9. Responsive Behavior

- Layout uses Bootstrap 5 grid (`col-md-4`, `col-md-6`, etc.)
- Forms use 3-column grid on medium+ screens (`col-md-4`)
- Sidebar is fixed width (270px) — no collapse behavior defined yet (future: add hamburger)
- Auth cards are capped at `max-width: 480px` and centered

---

## 10. CSS Architecture Rules

1. **Global tokens** live in `src/styles.css` under `:root { ... }`
2. **Component-scoped styles** live in each component's `.css` file; they use the same token values hardcoded (hex) for now
3. **Bootstrap 5** is the utility baseline; Lumina classes override or extend it with `!important` where necessary
4. **Naming convention:** `.btn-lumina-*` for primary brand buttons, `.btn-*-action` for table action buttons, `.status-*` for status badges
5. All color values ultimately resolve to:
   - **Sky blue:** `#41B3E3`
   - **Dark navy:** `#002D5B` / `#001A33` / `#001529`

---

## 11. Quick Reference — Class Cheat Sheet

```
Buttons
  .btn-lumina-main     → gradient primary CTA
  .btn-lumina-outline  → outlined secondary / cancel
  .btn-save-action     → solid sky-blue save/submit
  .btn-edit-action     → ghost sky-blue edit
  .btn-status-action   → base for toggle buttons
  .btn-to-disable      → muted red (active → disable)
  .btn-to-enable       → teal-green (disabled → enable)
  .btn-login-grad      → auth page gradient button

Status
  .status-badge        → base pill badge
  .status-active       → sky-blue tint, darker text
  .status-disabled     → gray tint, gray text

Table
  .table-container     → scrollable wrapper (max-height 565px)
  .sticky-top          → sticky thead

Auth
  .auth-wrapper        → full-screen animated bg
  .glass-card          → frosted glass card
  .glass-input         → translucent input
  .glass-input-icon    → input group icon prefix

Layout
  .sidebar             → dark gradient left rail
  .active-link         → sky-blue active nav item
  .profile-drawer      → left slide-in panel
  .drawer-overlay      → blurred dark backdrop
```
