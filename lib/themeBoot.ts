// Pre-paint theme script: runs in <head> before the first paint so a saved look
// (vibe × light/dark/auto × accent) is applied without a flash. Built from the same
// VIBES data as lib/theme.ts applyTheme(), so the two cannot drift.
import { VIBES, DEFAULT_VIBE, paletteVars } from './themeTokens';

const TEXT_SIZE_PX = { small: 14, normal: 16, large: 18, huge: 20 } as const;

export function themeBootScript(): string {
  const table: Record<string, { light: Record<string, string>; dark: Record<string, string>; accents: Record<string, Record<string, string>> }> = {};
  for (const v of Object.values(VIBES)) {
    const accents: Record<string, Record<string, string>> = {};
    for (const a of v.accents) {
      accents[a.hex] = { '--accent': a.hex, '--accent-soft': a.soft };
    }
    const base = (m: 'light' | 'dark') => {
      const all = paletteVars(v, m, v.accents[0]);
      delete all['--accent'];
      delete all['--accent-soft'];
      return all;
    };
    table[v.id] = { light: base('light'), dark: base('dark'), accents };
  }
  const data = JSON.stringify({ t: table, d: DEFAULT_VIBE, s: TEXT_SIZE_PX });
  return `(function(){try{var D=${data};var L=localStorage,r=document.documentElement;
var th=L.getItem('theme')||'system';
var m=th==='dark'||th==='light'?th:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
var vid=L.getItem('theme-vibe');if(!D.t[vid])vid=D.d;var v=D.t[vid];
var ah=L.getItem('theme-accent');var a=v.accents[ah];if(!a){for(var k in v.accents){a=v.accents[k];break}}
r.classList.toggle('dark',m==='dark');r.setAttribute('data-mode',m);r.setAttribute('data-vibe',vid);r.setAttribute('data-accent',a['--accent']);
var p=v[m];for(var x in p)r.style.setProperty(x,p[x]);for(var y in a)r.style.setProperty(y,a[y]);
var sz=L.getItem('theme-text-size');if(!D.s[sz])sz='normal';r.style.setProperty('font-size',D.s[sz]+'px');r.setAttribute('data-text-size',sz);
r.classList.toggle('dyslexia',L.getItem('theme-dyslexia')==='true');r.classList.toggle('high-contrast',L.getItem('theme-high-contrast')==='true');r.classList.toggle('reduce-motion',L.getItem('theme-reduce-motion')==='true');
}catch(e){}})();`;
}
