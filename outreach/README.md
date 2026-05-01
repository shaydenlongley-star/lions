# Shaydefy Outreach System

## Setup (one-time)

### 1. Copy and fill in credentials
```
cp .env.example .env
```

Fill in `.env`:

**SerpAPI key** (prospect finder):
- Go to serpapi.com → sign up → copy API key
- Free tier: 100 searches/month

**Gmail OAuth2** (email sender):
- Go to console.cloud.google.com
- Create project → Enable Gmail API
- OAuth 2.0 credentials → Desktop app
- Copy Client ID + Client Secret into .env
- Go to https://developers.google.com/oauthplayground
  - Top right gear → tick "Use your own OAuth credentials" → paste Client ID + Secret
  - Left panel: find "Gmail API v1" → select `https://mail.google.com/`
  - Authorize → Exchange for tokens → copy Refresh Token into .env
- Set GMAIL_FROM to your Gmail address

---

## Daily workflow

### Step 1 — Find prospects (run weekly)
```
node prospect-finder.js
```
Scrapes Google Maps for Bangkok businesses → saves to `prospects.csv`

### Step 2 — Score websites (run after finder)
```
node scorer.js
```
Rates each website 0–10. Score ≤4 = bad site = priority target. Updates `prospects.csv`.

### Step 3 — Send emails (run daily)
```
node email-sender.js
```
Sends Touch 1 to new prospects + follow-ups to anyone due today. Max 20/day.

Test without sending:
```
node email-sender.js --dry-run
```

### Step 4 — Check follow-ups
```
node tracker.js follow-up
```
Shows everyone who needs action today.

### Step 5 — Update status when someone replies
```
node tracker.js update <id> interested
```
Statuses: `sent` → `replied` → `interested` → `closed` / `dead`

---

## The Mockup Hook (do this weekly for top targets)

1. Open `prospects.csv`, filter `priority = HIGH`
2. Pick 5–10 businesses
3. Open shaydefy-v2, swap hero content to match their brand (~30 min each)
4. Screenshot at 1440px
5. Send as Touch 3 email + Instagram DM simultaneously
6. Expected reply rate: 20–40%
