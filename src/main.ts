import { checkAccess, isInstalledApp, renderInstall, renderUnlock } from './access/gate';
import { registerSW } from 'virtual:pwa-register';

const root = document.getElementById('app')!;

async function boot(): Promise<void> {
  if (!(await checkAccess())) {
    // App installée : saisie du code. Navigateur : explications pour installer l'app.
    if (isInstalledApp()) renderUnlock(root, () => void boot());
    else renderInstall(root, () => void boot());
    return;
  }
  document.title = 'Marvel Rush';
  registerSW({ immediate: true });
  // Point d'entrée de l'application : l'agent Interface remplace cet écran provisoire par la navigation complète.
  const { startApp } = await import('./ui/app');
  startApp(root);
}

void boot();
