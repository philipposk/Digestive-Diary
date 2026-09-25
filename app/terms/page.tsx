import PageHeader from '@/components/ui/PageHeader';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata(
  'Terms',
  'Terms of use for Digestive Diary — a logging tool, not a medical device.'
);

export default function TermsPage() {
  return (
    <article className="w-full max-w-2xl mx-auto px-5 pb-12">
      <PageHeader title="Terms of Service" subtitle="Last updated: September 25, 2026" />
      <div className="space-y-4 text-[14px] ink-soft leading-relaxed">
        <section>
          <h2 className="font-heading text-[18px] ink mt-0">Not medical advice</h2>
          <p>
            Digestive Diary is a personal logging tool. It does not diagnose, treat, or prevent any condition.
            Always consult a qualified clinician for medical decisions.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-[18px] ink">Your responsibility</h2>
          <p>
            You are responsible for the accuracy of your logs and for keeping backup passphrases secure.
            Do not share account access with others unless you intend to.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-[18px] ink">Acceptable use</h2>
          <p>
            Do not use the app to store illegal content or to attempt to breach our systems.
            AI features must not be used to seek emergency medical guidance.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-[18px] ink">Availability</h2>
          <p>
            We aim for reliable service but provide the app as-is. Local-only mode works offline;
            cloud sync depends on Supabase and your network connection.
          </p>
        </section>
      </div>
    </article>
  );
}
