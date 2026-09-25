import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';

export default function NotFound() {
  return (
    <div className="w-full max-w-lg mx-auto px-5 py-12 text-center">
      <PageHeader title="Page not found" subtitle="This route doesn't exist in your diary." />
      <p className="text-[48px] font-heading ink mb-6" aria-hidden>
        404
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="btn-primary px-6 py-3 rounded-full text-[14px]">
          Back to Today
        </Link>
        <Link href="/help" className="btn-secondary px-6 py-3 rounded-full text-[14px]">
          Help & FAQ
        </Link>
      </div>
    </div>
  );
}
