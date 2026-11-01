// Petits utilitaires d'interface et icônes tracées pour le jeu.

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export const crownIcon = '<svg viewBox="0 0 32 26" aria-hidden="true"><path d="M3 22 1 6l8 6 7-11 7 11 8-6-2 16Z" stroke-width="2" stroke-linejoin="round"/><path d="M4 22h24v3H4Z" stroke-width="1.6"/></svg>';
export const iconPause = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6ZM14 4h4v16h-4Z"/></svg>';
export const iconSound = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l6 5V4L7 9Z"/><path d="M16 8c2 2 2 6 0 8M19 5c4 4 4 10 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
export const iconMute = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l6 5V4L7 9Z"/><path d="m16 9 6 6m0-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
export const iconLock = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11V8a6 6 0 0 1 12 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M4 11h16v11H4Z"/></svg>';
