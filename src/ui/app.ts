// Écran provisoire (étape 0). L'agent Interface le remplace par la navigation façon Rush Royale.

export function startApp(root: HTMLElement): void {
  root.innerHTML = `
  <main style="min-height:100vh;display:grid;place-items:center;background:#1d1733;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px">
    <div>
      <h1 style="font-size:44px;line-height:1;margin:0;color:#f6c64a;text-shadow:0 4px 0 #b8322f">MARVEL <span style="color:#e8413b">RUSH</span></h1>
      <p style="opacity:.8;margin-top:16px">En construction. Le jeu arrive étape par étape.</p>
    </div>
  </main>`;
}
