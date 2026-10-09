import { checkAccess, isInstalledApp, renderNotFound, renderUnlock } from './access/gate';
import { registerSW } from 'virtual:pwa-register';

const root = document.getElementById('app')!;

async function boot(): Promise<void> {
  if (!(await checkAccess())) {
    // Dans l'app installée (iPhone), on propose de saisir la clé au lieu de la page 404.
    if (isInstalledApp()) renderUnlock(root, () => void boot());
    else renderNotFound(root);
    return;
  }
  document.title = 'Marvel Rush';
  registerSW({ immediate: true });
  // Point d'entrée de l'application : l'agent Interface remplace cet écran provisoire par la navigation complète.
  const { startApp } = await import('./ui/app');
  startApp(root);
}

void boot();
