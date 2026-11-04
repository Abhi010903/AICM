import { AssistantSearch } from './AssistantSearch';

export function PublicSearch({ className = '' }: { className?: string }) {
  return <AssistantSearch className={className} />;
}
