AAK AI — ABEL INTELLIGENCE
Cloud accounts & synchronisation upgrade
Intended domain: https://aak.com.zm

WHAT THIS RELEASE ADDS
- Email/password registration, sign-in and sign-out through Supabase Auth.
- Email confirmation and password reset flows.
- Cloud conversation storage in Supabase PostgreSQL.
- Row Level Security policies so each signed-in user can access only their own conversation rows.
- Cross-device conversation retrieval after signing in.
- Separate local guest history and per-account browser caches to avoid mixing chats between accounts.
- Automatic cloud saves after conversation changes and a manual background reconciliation on sign-in / reconnect.
- Local guest mode remains available when accounts are not configured or the user is signed out.
- Existing Gemini API integration remains on Cloudflare Pages Functions; GEMINI_API_KEY stays server-side.
- Bottom message composer now has a + attachment control on the left of the message field.
- Attach up to four JPG, PNG, WebP or PDF files (4 MB combined maximum); files are sent to Gemini with the prompt. File contents are not stored in conversation history; attachment names/types are retained as message metadata.

PROJECT STRUCTURE
- index.html: AAK AI application and account UI
- supabase-config.js: public Supabase project URL + publishable key placeholders
- supabase/schema.sql: database table, grants, RLS policies and updated_at trigger
- functions/api/chat.js: server-side Gemini API integration
- functions/api/admin-notify.js: authenticated server-side email notifications for new reports and feedback
- privacy.html: privacy disclosure for local and cloud conversation storage
- manifest.webmanifest + sw.js: installable PWA shell
- assets/aak-logo.png: supplied full-resolution AAK crest used in the interface
- assets/aak-app-icon.png: square installable app/browser icon derived from the crest
- _headers: browser security headers / CSP

PART A — CREATE THE SUPABASE PROJECT
1. Go to https://supabase.com/ and create a project for AAK AI.
2. Choose a strong database password and keep it private. It is not the AAK AI publishable key.
3. Wait for the project database to finish provisioning.

PART B — CREATE THE CONVERSATIONS TABLE
1. Open your Supabase project dashboard.
2. Open SQL Editor and create a new query.
3. Open this project's supabase/schema.sql file, copy its complete contents and paste them into the SQL Editor.
4. Run the SQL. It creates public.conversations, enables Row Level Security, grants the required operations to authenticated users only, and adds policies that bind every row to auth.uid().
5. Confirm the conversations table appears in Table Editor. Do not disable RLS.

PART C — CONFIGURE THE PUBLIC CLIENT KEY
1. In Supabase, open Project Settings → API (or API Keys, depending on the dashboard layout).
2. Copy the Project URL.
3. Copy the publishable key. If the dashboard only shows the legacy anon key, that can also be used with the RLS policies in this project.
4. Edit supabase-config.js:
   url: "https://YOUR_PROJECT_REF.supabase.co"
   publishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
5. Replace both placeholders with the values from your own project and save the file.
6. The publishable/anon key is intended for browser use. NEVER put a secret key or service_role key in supabase-config.js, index.html, GitHub, or any browser code. RLS is mandatory because the publishable key is not a user identity.

PART D — CONFIGURE EMAIL AUTHENTICATION
1. In Supabase, open Authentication → URL Configuration.
2. Set Site URL to https://aak.com.zm once the domain is connected.
3. Add redirect URLs for the production site and your Cloudflare Pages preview, for example:
   https://aak.com.zm/**
   https://YOUR-PROJECT.pages.dev/**
4. In Authentication → Providers, ensure Email is enabled.
5. Keep email confirmation enabled for production.
6. Configure a custom SMTP provider before public launch so confirmation and password-reset emails are delivered reliably. Supabase's default email service may have testing limits.
7. Check the email templates and make sure confirmation and password recovery links return to the AAK AI site.

PART E — DEPLOY TO CLOUDFLARE PAGES
1. Upload the CONTENTS of this folder to the root of your GitHub repository. Do not upload the outer folder as another nested folder.
2. Ensure these paths exist at repository root:
   index.html
   supabase-config.js
   supabase/schema.sql
   functions/api/chat.js
   _headers
   privacy.html
   manifest.webmanifest
   sw.js
   assets/aak-logo.png
   assets/aak-app-icon.png
3. Cloudflare Pages build settings:
   Framework preset: None
   Build command: exit 0
   Build output directory: .
   Root directory: repository root
4. In Cloudflare Pages → Settings → Variables and Secrets, add GEMINI_API_KEY as a SECRET. Keep it server-side; never put it in GitHub or the public config file.
5. Deploy and test the *.pages.dev preview first.
6. After the domain is registered and connected to Cloudflare, configure aak.com.zm under Pages → Custom domains.

PART F — TEST ACCOUNTS AND CLOUD SYNC
1. Open the deployed AAK AI site and choose Sign in / Create account in the left sidebar.
2. Create an account with an email address you can access and a password of at least 8 characters.
3. Confirm the email if confirmation is enabled, then sign in.
4. Send a test prompt. Wait for the sidebar sync status to say “All changes saved to cloud”.
5. Open AAK AI in another browser or device, sign in with the same account, and confirm that the conversation appears.
6. Sign out and confirm that the signed-in account's history is not shown in the guest workspace.
7. Test password recovery using the Forgot password link.

IMPORTANT SECURITY NOTES
- Supabase Auth handles passwords; AAK AI does not store raw passwords.
- Database rows are protected by Row Level Security policies using auth.uid() = user_id.
- Never disable RLS on public.conversations.
- Never expose Supabase service_role / secret keys. Only the publishable (or legacy anon) key belongs in supabase-config.js.
- Configure Cloudflare rate limiting for POST /api/chat and monitor Gemini usage.
- Supabase email delivery, data retention, backup settings and privacy obligations must be reviewed before a public launch.
- Cloud sync requires an internet connection. When offline, local changes remain on the current device and can be synchronised after reconnecting.
- Signing out does not delete cloud data. Account deletion and data requests need an operator-managed process until a self-service deletion feature is added.

ATTACHMENTS
- The + button beside the message field accepts JPG, PNG, WebP and PDF files.
- Up to four files can be attached to one message, with a combined 4 MB limit.
- The latest user message is sent to the Gemini API with the file content. AAK AI stores attachment names/types in chat history, not the binary file contents.
- The backend validates the MIME type and request size. Do not upload confidential documents unless you are comfortable sending them to Google Gemini for processing.

MODEL
The server-side chat function currently uses the Gemini model ID gemini-3.8-flash. Model availability, quotas and pricing are controlled by Google and may change. Verify the model and pricing in the current Gemini documentation before production budgeting.

USEFUL LINKS
Supabase: https://supabase.com/
Supabase Auth: https://supabase.com/docs/guides/auth
Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
Gemini API key: https://aistudio.google.com/app/apikey
Gemini models: https://ai.google.dev/gemini-api/docs/models
Cloudflare Pages: https://developers.cloudflare.com/pages/

RESPONSE ACTIONS
- Successful AI responses include Copy, Helpful / Not helpful feedback, Read aloud, Share, and a More options menu.
- Voice playback uses the browser/device speech synthesis engine; availability and voice quality depend on the device.
- Share uses the device's native share sheet when supported, with copy-to-clipboard fallback.
- Feedback selection is stored with the local conversation message and follows the existing chat persistence/sync behavior.


PART G — FINAL RELEASE CHECKLIST
Before announcing AAK AI publicly, complete every item below:

1. Replace the Supabase URL and publishable key placeholders in supabase-config.js. Do not commit any service_role key.
2. Add GEMINI_API_KEY as a Cloudflare Pages secret, then redeploy.
3. Confirm the model is available to your Google AI Studio project and review its current quota and pricing. This release uses gemini-3.8-flash, which is listed as a stable Gemini API model in Google's current model documentation.
4. Configure Supabase email confirmation, password reset redirects and a production SMTP provider. Test on a real inbox.
5. In Cloudflare, create a rate-limiting rule for POST /api/chat. Start conservatively (for example, a per-IP burst limit) and tune it using real traffic. The Gemini endpoint is public, so rate limiting and billing alerts are essential to prevent abuse and unexpected costs.
6. Configure Google AI Studio billing/quota alerts and Cloudflare usage alerts. Set an explicit monthly budget and review usage regularly.
7. Add a monitored official support email to privacy.html and establish a process for account deletion, data requests and security reports. Do not publish the site with a placeholder or unmonitored contact.
8. Test on Android Chrome and desktop browsers: new chat, conversation history, attachments, microphone permission, send/receive, copy, share, read aloud, feedback, sign-in, sign-out, password recovery, offline shell and cross-device sync.
9. Test that one account cannot see another account's conversations. Keep Supabase Row Level Security enabled.
10. Verify the custom domain uses HTTPS, then test https://aak.com.zm/api/chat in a browser. A status response should report the API service; configured should be true after the secret is set.
11. Review privacy.html against the final provider settings and applicable Zambian data-protection requirements before public launch.
12. Keep a private backup of the deployed source and Supabase schema before each release.

VOICE INPUT
- Voice input uses the browser's SpeechRecognition API where supported. The microphone control now toggles listening on/off, displays live status, and reports common permission/device errors.
- Voice recognition availability and supported languages vary by browser and device. HTTPS is required. Speech is processed by the browser's speech-recognition provider; do not assume it is processed locally.

RELEASE LIMITATIONS TO ADDRESS BEFORE A WIDE PUBLIC LAUNCH
- The current chat endpoint does not implement user authentication or application-level per-user quotas. Configure Cloudflare rate limiting and monitor provider usage before sharing the URL publicly.
- Account deletion is operator-managed; publish a support contact and implement a deletion workflow.
- The browser's local conversation cache is not encrypted by this application. Users should avoid storing highly sensitive content.
- Voice input depends on browser support and microphone permissions.

SOCIAL SIGN-IN AND RESPONSE FEEDBACK (REQUIRED SETUP)

The sign-in screen includes Google, Apple and Facebook OAuth buttons, powered by Supabase Auth. The buttons are application code only: each provider must be enabled and configured in your Supabase project before users can complete sign-in.

1. In Supabase Dashboard, open Authentication -> URL Configuration.
   Set Site URL to https://aak.com.zm and add https://aak.com.zm/** to the allowed redirect URLs (plus your exact preview/development URLs if needed).
2. Open Authentication -> Sign In / Providers. Enable Google, Apple and Facebook and enter the provider credentials requested by Supabase.
3. In each provider developer console, register the callback URL shown on that provider's Supabase settings page. The Supabase callback normally has this form:
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
4. Google: create a Web OAuth client; add https://aak.com.zm as an authorised JavaScript origin and the Supabase callback as an authorised redirect URI.
5. Facebook: configure Facebook Login, request the email permission, and add the Supabase callback to Valid OAuth Redirect URIs.
6. Apple: configure a Services ID, website domain/return URL and Sign in with Apple key as required by Apple's developer portal. Apple web sign-in requires an Apple Developer account and periodic client-secret maintenance.
7. Never place provider client secrets in this website's JavaScript or supabase-config.js. Enter them only in the Supabase provider configuration.

RESPONSE FEEDBACK AND REPORTS

Run the updated supabase/schema.sql in the Supabase SQL Editor. It creates response_feedback and response_reports with row-level security. Feedback and reports require an authenticated account. Users can change/remove their own thumbs feedback; reports are insert-only for users and cannot be read back by them. Review submitted reports only from a trusted administrator environment using a server-side secret; never expose a service_role key in the browser. This release includes server-side email alerts for new response reports and new/changed feedback. It does not include a full staff moderation dashboard; staff review records in the secured Supabase dashboard for now.

OAUTH TESTING

Test each provider using a real account after provider setup. Test both the production domain and any configured preview domain. Apple OAuth may return no display name; AAK AI falls back to the email/account label and users can complete their profile later.


STAFF AND ADMINISTRATOR NOTIFICATIONS

This release sends email alerts for newly submitted response reports and new/changed response feedback. Notifications are delivered by a Cloudflare Pages Function and Resend. The browser never receives the webhook secret or Resend API key.

1. Create/verify a sending domain in https://resend.com/ and create an API key with permission to send email.
2. In Cloudflare Pages -> your project -> Settings -> Variables and Secrets, add these as encrypted secrets (not plain-text variables):
   - RESEND_API_KEY: your Resend API key.
   - AAK_ADMIN_EMAIL: the monitored staff/admin inbox that should receive alerts.
   - AAK_FROM_EMAIL: a verified sender, for example AAK AI <notifications@your-verified-domain>.
   - AAK_WEBHOOK_SECRET: a long random secret (at least 32 random bytes). Generate it locally; do not reuse a password.
3. Deploy the project so /api/admin-notify is available.
4. In Supabase Dashboard -> Database -> Webhooks, create an HTTP webhook named aak-ai-admin-notifications. Set method POST and URL to https://aak.com.zm/api/admin-notify (use your actual deployed Pages URL until the custom domain is live). Add header Authorization with value Bearer YOUR_AAK_WEBHOOK_SECRET and Content-Type: application/json.
5. Subscribe to public.response_reports INSERT events. Also subscribe to public.response_feedback INSERT and UPDATE events. Do not subscribe to DELETE; deletion is intentionally ignored by the endpoint.
6. Save and send a test report/feedback from a signed-in test account. Confirm the email arrives in the monitored inbox. Check Cloudflare Pages Function logs and Supabase webhook delivery logs if it does not.
7. Keep the admin inbox monitored, restrict access to the Cloudflare project and Resend account, and rotate AAK_WEBHOOK_SECRET if it is ever exposed.

Notification privacy and operation:
- Emails include the user UUID, conversation identifier, message index, report reason and response excerpt where applicable. Treat the inbox as confidential and limit staff access.
- The endpoint validates a shared bearer secret, accepts only the two expected tables and event types, limits payload size, and escapes database content before rendering email HTML.
- Failed email delivery returns an error to the webhook sender; check delivery logs and retry failed events from Supabase where available.
- These are email alerts, not a staff dashboard or automatic moderation decision. Staff must review reports and decide follow-up actions in the secured Supabase environment.
