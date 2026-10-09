// Profil et réglages (§5.4, §8.12) : profil actif (avatar, niveau, record, statistiques), avatar à changer,
// changement de profil (deux au plus), création du deuxième profil.
import type { UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { accountLevel } from '../meta/economy';
import { MAX_PROFILES, getProfile, listProfiles, switchProfile, updateProfile } from '../meta/profile';
import { esc, fmt, icon, openSheet, portraitUrl, toast } from './kit';

export async function openProfileSheet(overlay: HTMLElement, o: { onNewProfile: () => void; onSwitched: () => void }): Promise<void> {
  const p = getProfile();
  if (!p) return;
  const all = await listProfiles();
  const a = accountLevel(p.xp);
  const owned = Object.keys(p.heroes) as UnitId[];
  const sheet = openSheet(overlay, {
    title: 'Profil',
    html: `
      <div class="pf-me">
        <span class="pf-av"><img src="${portraitUrl(p.avatar)}" alt=""></span>
        <div><b class="pf-name">${esc(p.name)}</b>
          <span class="pf-lv">Niveau de compte ${a.level} · ${a.into}/${a.need} XP</span>
          <span class="pf-xp"><i style="width:${(a.into / a.need) * 100}%"></i></span></div>
      </div>
      <dl class="pf-stats">
        <div><dt>${icon('record')}Record Infini</dt><dd>${p.infiniteBest} vagues</dd></div>
        <div><dt>${icon('collection')}Héros</dt><dd>${owned.length}/${Object.keys(UNITS).length}</dd></div>
        <div><dt>${icon('tirages')}Tirages</dt><dd>${fmt(p.pullsDone ?? 0)}</dd></div>
        <div><dt>${icon('campagne')}Étoiles</dt><dd>${Object.values(p.campaign).reduce((n, l) => n + l.stars.filter(Boolean).length, 0)}</dd></div>
      </dl>
      <h3 class="pf-h">Avatar</h3>
      <div class="pf-avs">${owned.map((id) => `<button class="pf-avb${id === p.avatar ? ' on' : ''}" data-av="${id}" aria-label="${esc(UNITS[id].name)}"><img src="${portraitUrl(id)}" alt=""></button>`).join('')}</div>
      <h3 class="pf-h">Profils sur cet appareil <small>${all.length}/${MAX_PROFILES}</small></h3>
      <ul class="pf-list">${all.map((q) => `<li class="${q.id === p.id ? 'on' : ''}">
        <span class="pf-av s"><img src="${portraitUrl(q.avatar)}" alt=""></span>
        <span class="pf-li"><b>${esc(q.name)}</b><small>Niveau ${accountLevel(q.xp).level} · ${Object.keys(q.heroes).length} héros</small></span>
        ${q.id === p.id ? '<em>Actif</em>' : `<button class="mr-btn green pf-sw" data-sw="${q.id}" data-tuto="profile-switch">Jouer</button>`}</li>`).join('')}</ul>
      ${all.length < MAX_PROFILES ? '<button class="mr-btn yellow pf-new" data-a="new" data-tuto="profile-new">Créer un deuxième profil</button>' : ''}
      <p class="pf-note">Chacun sa progression : jouer avec un profil ne touche jamais à l’autre.</p>`,
  });
  sheet.body.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const av = t.closest<HTMLElement>('[data-av]')?.dataset['av'] as UnitId | undefined;
    if (av) {
      await updateProfile((q) => { q.avatar = av; });
      sheet.body.querySelectorAll('.pf-avb').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset['av'] === av));
      sheet.body.querySelector<HTMLImageElement>('.pf-me img')!.src = portraitUrl(av);
      return;
    }
    const sw = t.closest<HTMLElement>('[data-sw]')?.dataset['sw'];
    if (sw) {
      const q = await switchProfile(sw);
      sheet.close();
      toast(`Profil de ${q?.name ?? '?'}`);
      o.onSwitched();
      return;
    }
    if (t.closest('[data-a="new"]')) { sheet.close(); o.onNewProfile(); }
  });
}
