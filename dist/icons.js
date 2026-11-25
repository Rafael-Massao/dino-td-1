const paths = {
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-2.9 2.4-2.9 4m0 3h.01"/>',
  volume: '<path d="M11 4 6 8H3v8h3l5 4V4zm4 4a5 5 0 0 1 0 8m3-11a9 9 0 0 1 0 14"/>',
  mute: '<path d="M11 4 6 8H3v8h3l5 4V4zm5 5 5 6m0-6-5 6"/>',
  settings: '<path d="m9.2 4 .6-2h4.4l.6 2 2 .9 2-.6 3.1 3.1-.6 2 .7 2v1.9l-.9 2 .6 2-3.1 3.1-2-.6-1.8.8-.6 2H9.8l-.6-2-2-.8-2 .6-3.1-3.1.6-2-.8-2v-1.9l.8-2-.6-2 3.1-3.1 2 .6z" transform="translate(1.2 1.2) scale(.9)"/><circle cx="12" cy="12" r="3"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  heart: '<path d="M20.7 8.7c0 4.1-4.7 7.6-8.7 10.5-4-2.9-8.7-6.4-8.7-10.5a4.5 4.5 0 0 1 8.7-1.6 4.5 4.5 0 0 1 8.7 1.6Z" fill="currentColor" stroke="none"/>',
  coin: '<circle cx="12" cy="12" r="8.6"/><path d="m12 7.5 3.4 4.5-3.4 4.5L8.6 12z" fill="currentColor" stroke="none"/>',
  flag: '<path d="M5 21V4m0 2c4.3-4.3 9.4 3.9 14-1v11c-4.6 4.9-9.7-3.3-14 1"/>',
  shield: '<path d="M12 3 4 6v5.8c0 4.1 3.4 7.1 8 9.2 4.6-2.1 8-5.1 8-9.2V6zm-3 9 2 2 4-4"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14m-7-7v14"/>',
  fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  fullscreenExit: '<path d="M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5"/>',
  fit: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/><circle cx="12" cy="12" r="2"/>',
  crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
  fast: '<path fill="currentColor" stroke="none" d="m3 5 9 7-9 7zm9 0 9 7-9 7z"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14m8-14v14" stroke-width="3"/>',
  tower: '<path d="M4 3h4v4h2V3h4v4h2V3h4v6l-3 3v7l2 2H5l2-2v-7L4 9zm3 9h10m-5 3v2"/>',
  medal: '<path d="m8 11-4-8h4l4 8m4 0 4-8h-4l-4 8"/><circle cx="12" cy="16" r="5"/><path d="m12 14 .5 1.4h1.6l-1.3 1 .5 1.5-1.3-.9-1.3.9.5-1.5-1.3-1h1.6z" fill="currentColor" stroke="none"/>',
  mouse: '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 6v4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
  feather: '<path d="M20 4c-6-2-13 2-12 9 6 2 12-3 12-9zM4 20 16 8"/>',
  range: '<path d="M4 19a15 15 0 0 1 15-15M9 19A10 10 0 0 1 19 9m-5 10a5 5 0 0 1 5-5"/>',
  radar: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 6-6"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V8a4 4 0 0 1 8 0v2m-4 4v2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 6M4 5v6h6"/>',
  leaf: '<path d="M20 4C9 3 4 8 5 16c8 3 16-2 15-12zM4 20l11-11"/>',
  waves: '<path d="M2 8q3-4 6 0t6 0 6 0m-18 5q3-4 6 0t6 0 6 0m-18 5q3-4 6 0t6 0 6 0"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10m0-10L3.3 17M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-.7-.8-4M20 14l-4 .7.8 4"/>',
  spark: '<path d="M12 2c.4 6.1 3.9 9.6 10 10-6.1.4-9.6 3.9-10 10-.4-6.1-3.9-9.6-10-10 6.1-.4 9.6-3.9 10-10z"/>',
  hex: '<path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9z"/><circle cx="12" cy="12" r="2.5"/>',
  signal: '<path d="M9 8a4.2 4.2 0 0 0 0 5.9m6-5.9a4.2 4.2 0 0 1 0 5.9M6 5a8.4 8.4 0 0 0 0 12m12-12a8.4 8.4 0 0 1 0 12m-6-4v8"/><circle cx="12" cy="10.5" r="1.3" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  loop: '<path d="M5 10c1-4.2 4.3-6.3 10.3-6.5 1.6 0 3.1.1 4.7.4-5.2 1.7-7.3 4.3-8.6 7.7l-1.1 6.3-5 2.6z"/><path d="m5 10 5.7 1.6"/>',
  drop: '<path d="M12 2.5C9.1 7 5.5 9.9 5.5 14.3a6.5 6.5 0 0 0 13 0c0-4.4-3.6-7.3-6.5-11.8zM9 15a3 3 0 0 0 2 2.7"/>',
  shovel: '<path d="m6 18-2 2m3-3 9-9m-.4-4.6 5 5-2.4 2.4-5-5zM4 12l8 8c-6 2-10 0-8-8z"/>'
};

export function icon(name) {
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] ?? paths.info) + '</svg>';
}

export function setIcon(element, name) {
  const oldIcon = element.firstElementChild;
  if (oldIcon?.tagName.toLowerCase() === 'svg') oldIcon.remove();
  element.insertAdjacentHTML('afterbegin', icon(name));
}
