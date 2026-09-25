import PageHeader from '@/components/ui/PageHeader';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata(
  'Privacy',
  'How Digestive Diary handles your health logs, cookies, and account data.'
);

export default function PrivacyPage() {
  return (
    <article className="w-full max-w-2xl mx-auto px-5 pb-12 prose-app">
      <PageHeader title="Privacy Policy" subtitle="Last updated: September 25, 2026" />
      <div className="space-y-4 text-[14px] ink-soft leading-relaxed">
        <section>
          <h2 className="font-heading text-[18px] ink mt-0">What we collect</h2>
          <p>
            Digestive Diary stores the logs you enter: food, symptoms, context, experiments, and optional photos.
            With an account, this data syncs to Supabase under your user ID. Without an account, data stays in your browser only.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-[18px] ink">AI features</h2>
          <p>
            When you use voice, chat, or image analysis, relevant log excerpts are sent to OpenAI or Groq to generate responses.
            We do not use your data to train third-party models. AI output is informational only, not medical advice.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-[18px] ink">Cookies</h2>
          <p>
            Essential cookies support sign-in sessions and theme preferences. We do not run third-party ad trackers.
            You can choose essential-only cookies in the consent banner.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-[18px] ink">Your rights</h2>
          <p>
            Export or delete your data anytime from Settings. Encrypted backups use a passphrase only you know.
            To request account deletion, sign out and contact your project administrator.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-[18px] ink">Contact</h2>
          <p>
            Questions about privacy? Use the floating chat button or email your app administrator.
          </p>
        </section>
      </div>
    </article>
  );
}
