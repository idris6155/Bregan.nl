# Bregan CMS

The Bregan website uses a lightweight CMS architecture:

- Public website: GitHub Pages
- Admin panel: `/admin/`
- Content database, authentication and media: Supabase
- Static fallback: the original product and translation data stay in the repository so the public website can still render if the CMS is temporarily unavailable.

## Administrator access

The initial Super Admin account has already been created and confirmed.

- Open `/admin/` and use **Sign in**.
- There is no public **Create account** flow anymore.
- A Super Admin creates additional staff accounts from **Team → Add user**.
- New staff accounts are confirmed immediately and can sign in with the temporary password, so the workflow does not depend on email-confirmation redirects.

## Roles

- **Super Admin**: full CMS, team and settings access.
- **Marketing**: Live Site Editor, website text, products, events, documents, media and site settings.
- **Sales**: products, events, documents, media and inquiries.
- **Viewer**: dashboard only.

## Main workflow

### Live Site Editor

Open **Live site editor**, choose the page and language, then work directly on the website preview:

- Click highlighted text to edit it.
- Use **Edit image** to upload a replacement image.
- Use **Edit product** to open the full product editor.
- Page-specific text changes are stored as CMS overrides and can be reviewed under **All text fields**.

### File handling

Editors do not need to paste image or document URLs.

- Product images: upload from the product editor.
- Event images: upload from the event editor.
- Website photography: upload from Live Site Editor or Settings.
- Documents: upload directly from Documents.
- General assets: upload, open or delete from Media Library.

## Modules

- Dashboard
- Live Site Editor
- Products
- All text fields
- Events
- Documents
- Inquiries
- Media library
- Team
- Settings

## Publish model

Products, events and text entries can be published or kept out of the public site. The public website reads published CMS content only.

## Security

All exposed CMS tables use Row Level Security. Public visitors can read only public/published content and submit inquiries. Editing requires an authenticated user with an authorized CMS role. The Supabase service-role key is used only inside the protected server-side Edge Function that creates staff accounts and is never included in browser code.
