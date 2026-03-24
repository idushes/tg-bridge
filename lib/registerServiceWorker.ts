'use client';

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration('/');
  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register('/sw.js');
}
