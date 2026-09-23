# Bregan CMS

The Bregan website now uses a lightweight CMS architecture:

- Public website: GitHub Pages
- Admin panel: /admin/
- Content database, authentication and media: Supabase
- Fallback: the original static product and translation data remain in the repository so the public website can still render if the CMS is temporarily unavailable.

## First administrator

1. Open /admin/
2. Use **Create account**.
3. The first account created in the Bregan CMS project is assigned **Super Admin**.
4. If email verification is requested, confirm the email and then sign in.
5. Additional users can create accounts from the same screen. They start as **Viewer** until a Super Admin changes their role under **Team**.

## Roles

- Super Admin: full CMS and team access.
- Marketing: website text, products, events, documents, media and site settings.
- Sales: products, events, documents, media and inquiries.
- Viewer: read-only / dashboard access.

## Modules

- Dashboard
- Products
- Website text (EN / DE)
- Events
- Documents
- Inquiries
- Media library
- Team
- Settings / website visuals

## Publish model

Products, events and text entries support published/draft states. The public site reads only published content.

## Security

All public-schema tables use Row Level Security. The public site can only read published/public records and submit inquiries. CMS editing requires an authenticated user with an allowed CMS role. The service-role key is never included in client code.
