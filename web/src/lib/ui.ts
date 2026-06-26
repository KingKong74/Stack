import type { BugStatus, Severity, Priority } from '../types';

export const PRODUCT_NAME = 'Stack';

export const STATUS_LABEL: Record<BugStatus, string> = {
  open: 'Open', investigating: 'Investigating', fixing: 'Fixing', fixed: 'Fixed',
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];
export const PRIORITY_ORDER: Priority[] = ['must', 'should', 'could', 'wont'];
export const PRIORITY_META: { key: Priority; label: string; color: string; short: string }[] = [
  { key: 'must', label: 'Must have', color: '#c4623d', short: 'Must' },
  { key: 'should', label: 'Should have', color: '#b08a2e', short: 'Should' },
  { key: 'could', label: 'Could have', color: '#6f9a72', short: 'Could' },
  { key: 'wont', label: "Won't (now)", color: '#a39c90', short: "Won't" },
];

// Activity tags read as "accent" when they signal unfinished work.
export const isAccentTag = (label: string) => /progress|needs|todo/i.test(label);
