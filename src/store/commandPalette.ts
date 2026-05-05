import { signal } from '@preact/signals';

export const paletteOpen = signal(false);
export const openPalette = () => { paletteOpen.value = true; };
export const closePalette = () => { paletteOpen.value = false; };

export const templateModalOpen = signal(false);
export const openTemplateModal = () => { templateModalOpen.value = true; };
export const closeTemplateModal = () => { templateModalOpen.value = false; };
