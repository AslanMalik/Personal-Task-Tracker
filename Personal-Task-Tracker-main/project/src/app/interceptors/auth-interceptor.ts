import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const PUBLIC_URLS = ['/api/login/', '/api/register/'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Не добавляем токен к публичным маршрутам
  const isPublic = PUBLIC_URLS.some(url => req.url.includes(url));
  if (isPublic) {
    return next(req);
  }

  const token = localStorage.getItem('access');

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }

  return next(req);
};