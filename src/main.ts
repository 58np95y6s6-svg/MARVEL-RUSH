import { checkAccess, renderNotFound } from './access/gate';
import { registerSW } from 'virtual:pwa-register';

const root = document.getElementById('app')!;

async function boot(): Promise<void> {
  if (!(await checkAccess())) {
    renderNotFound(root);
    return;
  }
  document.title = 'Marvel Rush';
  registerSW({ immediate: true });
  // Point d'entrée de l'application : l'agent Interface remplace cet écran provisoire par la navigation complète.
  const { startApp } = await import('./ui/app');
  startApp(root);
}

void boot();
