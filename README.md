# augyanix.github.io

Personal site of **Maadhava Rao** (Augyanix): profile, projects, and free hands-on AI resources from **AI with Augyanix** (Instagram & YouTube). Hosted on GitHub Pages; custom domain `augyanix.in`.

| Page | Path | Notes |
|---|---|---|
| Home | `/` | Profile, work, career "traceroute", teaching, top resources |
| Free resources | `/resources/` | The hub for every reel / DM resource |
| Day 5 · Complete AI Model Playbook | `/playbook/ai-model/` | Self-contained page |
| Day 7 · Ready-Made AI Prompts | `/playbook/prompts/` | Self-contained page |
| Not found | `404.html` | GitHub Pages serves it for unknown paths |

## How it is built

- Plain static HTML + one stylesheet, `assets/site.css`. No build step, no JavaScript, no trackers.
- Fonts are self-hosted (`assets/fonts/`, Geist and Geist Mono, SIL Open Font License, see `OFL.txt`), so visitors' browsers make no third-party requests.
- Each page sets a strict Content-Security-Policy (`default-src 'none'`, only same-origin styles, fonts and images). Keep styles in `site.css`: inline `style=""` attributes are blocked by design.
- Images: `assets/img/` (card screenshots, avatar, `og.png` share image 1200×630, `favicon.svg`, `apple-touch-icon.png`).
- Search: `sitemap.xml` and `robots.txt`. Add every new page to `sitemap.xml`.

### Adding a resource
1. Put the page at `/playbook/<name>/index.html` (or `/resources/<name>/`).
2. Add a row to `resources/index.html` under the right group, and to the home page's "Free resources" list if it is a top one.
3. Add the URL to `sitemap.xml`.
4. Point the auto-DM reply at the `augyanix.in` URL, never at Notion or another host.

The playbooks are generated in the reel workspace (e.g. `videos/day5-how-an-ai-model-is-built/playbook/build_html.py`); copy the new `site/index.html` into `playbook/<name>/index.html` and push.

## Custom domain: augyanix.in
Hosting stays on GitHub Pages; the domain just points here. Old `augyanix.github.io` links redirect automatically once the domain is set.

Status (12 Nov 2026): the Hostinger verification hold is cleared; nameservers are Hostinger's default (`artemis` / `hermes.dns-parking.com`).

1. **GitHub first:** account Settings → Pages → **Add a verified domain** `augyanix.in`, and add the TXT record it shows in Hostinger DNS. This stops anyone else claiming the domain on GitHub (domain takeover).
2. Hostinger DNS: delete the parking `A @` record, then add `A @ → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153` and `CNAME www → augyanix.github.io`.
3. Check: `dig +short augyanix.in` shows only the 185.199.x.153 addresses.
4. Only then: `echo augyanix.in > CNAME`, commit, push. Repo Settings → Pages → custom domain `augyanix.in` → tick **Enforce HTTPS** once the certificate is issued.
