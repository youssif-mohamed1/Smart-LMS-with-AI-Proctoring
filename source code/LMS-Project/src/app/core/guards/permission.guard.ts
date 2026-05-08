import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  // Supports both a single permission string and an array of strings (OR logic).
  // A single string keeps full backward-compatibility with all existing routes.
  const requiredPermission = route.data['permission'] as string | string[];

  const hasAccess = Array.isArray(requiredPermission)
    ? requiredPermission.some((p) => permissionService.hasPermission(p))
    : permissionService.hasPermission(requiredPermission);

  if (hasAccess) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};