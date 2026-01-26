import { Link } from 'wouter';

export default function ModernNavigation({
  pageTitle,
  currentPage,
}: {
  pageTitle?: string;
  currentPage?: string;
}) {
  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/tyt-dashboard" className="font-semibold text-gray-800">
          {pageTitle ?? 'LearnConnect'}
        </Link>
        <div className="flex gap-4">
          <Link href="/tyt-dashboard">TYT</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </nav>
  );
}
