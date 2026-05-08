import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // بنشوف هل فيه Token متخزن في المتصفح ولا لا
  const token = localStorage.getItem('token'); 

  if (token) {
    // لو فيه توكن، اتفضل ادخل يا بطل
    return true; 
  } else {
    // لو مفيش، ارجع لصفحة اللوجين فوراً
    router.navigate(['/login']);
    return false;
  }
};