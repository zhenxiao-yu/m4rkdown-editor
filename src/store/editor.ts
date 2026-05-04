import { signal, computed } from '@preact/signals';
import md from '@/lib/markdownit';
import { activeDoc } from './documents';

export type TabId = 'preview' | 'tree' | 'source';

export const activeTab = signal<TabId>('preview');

export const markdownSource = computed(() => activeDoc.value?.content ?? '');

export const parsedHtml = computed(() => md.render(markdownSource.value));
