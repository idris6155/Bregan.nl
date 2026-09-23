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


## Page Builder and publishing workflow

The CMS now includes a no-code page management layer.

### Pages & Builder
- Existing Bregan pages can have sections shown, hidden and reordered.
- New custom pages can be created without adding a new HTML file.
- Custom page blocks currently include Hero, Text, Image + text and CTA.
- Each page has English/German SEO title, description and social share image.
- Custom page URLs use the generic renderer: `page.html?slug=<page-slug>`.

### Navigation & Footer
- Header menu items can be added, edited, hidden, deleted and reordered.
- Menu items can point to any published CMS page.
- Footer blurb, brand chip, CTA and Privacy link visibility are editable.

### Draft / Preview / Publish
- **Save draft** does not change the public website.
- **Preview draft** shows the unpublished page structure.
- **Publish** copies the draft into the public version and creates a revision.

### Version History
Every Page Builder, Navigation and Footer publish creates a revision.
**Restore to draft** never changes the live website immediately. Review the restored draft first, then publish it.

### Public access boundary
Anonymous website visitors can read only published CMS page/global columns. Draft page data, draft SEO and draft global settings are not granted to the anonymous role.
