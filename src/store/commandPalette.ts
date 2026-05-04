import { signal } from '@preact/signals';

export const paletteOpen = signal(false);
export const openPalette = () => { paletteOpen.value = true; };
export const closePalette = () => { paletteOpen.value = false; };
