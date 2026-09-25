import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import FAQ from '@/components/ui/FAQ';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata(
  'Help',
  'FAQ, tips, and support for using Digestive Diary.'
);

const FAQ_ITEMS = [
  {
    question: 'Is this medical advice?',
    answer:
      'No. Digestive Diary only organizes your own logs and surfaces patterns. Always talk to a clinician about symptoms and treatment.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'By default, in your browser. With Google sign-in and cloud mode enabled, logs sync to your Supabase account.',
  },
  {
    question: 'Can I export data for my doctor?',
    answer:
      'Yes. Settings includes a doctor PDF report and JSON export. You can also create an encrypted backup file.',
  },
  {
    question: 'How do I delete everything?',
    answer:
      'Settings → Delete all data. This clears local storage. If signed in, also delete cloud rows from your Supabase project admin.',
  },
  {
    question: 'Do I need API keys?',
    answer:
      'Core logging works without keys. OpenAI/Groq keys unlock voice, chat, and image analysis features.',
  },
];

export default function HelpPage() {
  return (
    <div className="w-full max-w-2xl mx-auto pb-12">
      <PageHeader title="Help & FAQ" subtitle="Quick answers about the diary." />
      <div className="px-5 space-y-6">
        <FAQ items={FAQ_ITEMS} />
        <section>
          <h2 className="font-heading text-[18px] ink mb-3">Stay updated</h2>
          <NewsletterSignup />
        </section>
        <section className="card p-4">
          <h2 className="font-heading text-[16px] ink mt-0 mb-2">Need more help?</h2>
          <p className="text-[13px] ink-soft m-0 mb-3">
            Use the floating chat button to ask questions about your logged data, or review our legal pages.
          </p>
          <div className="flex flex-wrap gap-3 text-[13px]">
            <Link href="/chat" className="text-accent hover:underline">Open AI chat →</Link>
            <Link href="/privacy" className="text-accent hover:underline">Privacy →</Link>
            <Link href="/terms" className="text-accent hover:underline">Terms →</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
