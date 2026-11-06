# augyanix.github.io

Free hands-on AI resources from **AI with Augyanix** (Instagram & YouTube), hosted with GitHub Pages.

| Page | Link |
|---|---|
| Home | https://augyanix.github.io/ |
| Day 5 · Complete AI Model Playbook | https://augyanix.github.io/playbook/ai-model/ |

Each page is one self-contained `index.html` (styles, logo and downloads inside).
The playbook is generated from `playbook.md` in the reel workspace (`videos/day5-how-an-ai-model-is-built/playbook/build_html.py`); copy the new `site/index.html` to `playbook/ai-model/index.html` and push.

## Custom domain: augyanix.in (later)
Hosting stays on GitHub Pages; the domain just points here. Old `augyanix.github.io` links redirect automatically.
1. Hostinger: clear the domain's **verification hold** (verify the owner email / contact details), and set the name servers back to Hostinger's own DNS.
2. Hostinger DNS: `A @ → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153` and `CNAME www → augyanix.github.io` (delete the old A record 2.57.91.93).
3. Check: `dig +short augyanix.in` shows the 185.199.x.153 addresses.
4. Only then: `echo augyanix.in > CNAME`, commit, push. Repo Settings → Pages → custom domain `augyanix.in` → tick **Enforce HTTPS**.
5. GitHub → Settings (account) → Pages → **Add a verified domain** `augyanix.in` (stops anyone else using it on GitHub).
