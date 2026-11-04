'use client';

import { AssistantSearch } from './AssistantSearch';

export function DashboardSearch({ className = '' }: { className?: string }) {
  return <AssistantSearch className={className} dark />;
}
