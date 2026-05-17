export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('SW registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'activated' &&
                navigator.serviceWorker.controller
              ) {
                console.log('SW: New content available; refresh for updates.');
              }
            });
          }
        });
      } catch (error) {
        console.warn('SW registration failed:', error);
      }
    });
  }
}
