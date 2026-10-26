export type JournalPane = 'journal' | 'note';

const TAB_ORDER = ['inicio', 'tasks', 'journal', 'habits', 'settings'] as const;
export type SwipeTab = (typeof TAB_ORDER)[number];

export function swipeDestination(
  tab: SwipeTab,
  journalPane: JournalPane,
  direction: -1 | 1,
): { tab: SwipeTab; journalPane: JournalPane } | null {
  if (tab === 'journal' && direction === 1 && journalPane === 'journal') {
    return { tab: 'journal', journalPane: 'note' };
  }
  if (tab === 'journal' && direction === -1 && journalPane === 'note') {
    return { tab: 'journal', journalPane: 'journal' };
  }

  const nextIndex = TAB_ORDER.indexOf(tab) + direction;
  if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return null;
  const nextTab = TAB_ORDER[nextIndex];
  if (nextTab === 'journal') {
    return { tab: 'journal', journalPane: direction === 1 ? 'journal' : 'note' };
  }
  return { tab: nextTab, journalPane };
}
