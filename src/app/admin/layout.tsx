import type { Metadata } from 'next';

// The committee's pages are for the committee; keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
