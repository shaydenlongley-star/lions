# Shaydefy — Brand Color Extraction Process

## Overview
Extract brand colors from Instagram accounts and submit them to the Shaydefy outreach tool for use in personalised outreach campaigns.

---

## Before You Start

1. Open a terminal in `C:\Claude Code\outreach-v2\`
2. Run the color server and **keep the window open**:
   ```
   node color-server.cjs
   ```
3. You should see: `Color server running on port 3457`
4. Open the launcher in your browser at **http://127.0.0.1:3457**

> ⚠️ **Always use `http://127.0.0.1:3457`** — NOT the `file://` URL.
> Chrome blocks localhost requests from `file://` pages (CORS), so the Submit button will silently fail.

---

## Prompt to Give Claude

Paste this at the start of the session:

```
The color server is running at http://127.0.0.1:3457.

Extract brand colors from the Instagram accounts below and submit them to the outreach tool. For each account:
1. Visit their Instagram profile
2. Analyze the color palette — logo, feed aesthetic, highlight covers, brand graphics
3. Go to http://127.0.0.1:3457, click ⬡ Colors
4. Set Round to [ROUND NUMBER]
5. Enter the handle, fill in the 5 color fields + a note, click Submit Colors →
6. Wait for "Submitted ✓" before moving to the next account

Accounts (Round [X]):
@handle1 — description, location
@handle2 — description, location
```

---

## Color Fields Guide

| Field | What to capture |
|-------|----------------|
| **Primary** | Dominant brand color — logo bg or key graphic color |
| **Secondary** | Second most used color in the feed/branding |
| **Accent** | Highlight color — borders, CTAs, decorative elements |
| **Bg** | Background color that best represents the brand |
| **Text** | Primary text color used on branded posts |

---

## What Claude Does (Step by Step)

1. Navigates to each Instagram profile
2. Zooms into the logo, highlight covers, and feed grid
3. Identifies 5 hex colors from visual analysis
4. Opens `http://127.0.0.1:3457` → clicks **⬡ Colors**
5. Sets Round, enters handle (no @ symbol)
6. Fills hex values + writes a note on logo style and feed vibe
7. Clicks **Submit Colors →**, waits for **Submitted ✓ — r[N]-[handle].json**
8. Moves to the next account

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Server offline" in Colors panel | You're on the `file://` URL — navigate to `http://127.0.0.1:3457` |
| Submit fails / "Failed" status | Same CORS issue — reload from HTTP URL |
| Server crashes on startup | Run `npm install` in outreach-v2 folder, then retry |
| "EADDRINUSE" error | Port 3457 already taken — close other terminals or reboot |
| Server stops mid-session | Terminal was closed — restart `node color-server.cjs` |

---

## Output Files

Each submission saves a JSON file in the outreach-v2 folder:

```
r3-kozueomakase.json
r3-kenshobangkok.json
```

Format: `r[round]-[handle].json`

---

## Round 3 Reference (May 2026)

| Handle | Primary | Secondary | Accent | Bg | Text | Notes |
|--------|---------|-----------|--------|----|------|-------|
| kozueomakase | `#1C3A2E` | `#C9A96E` | `#D4A853` | `#1A1A1A` | `#F5F0E8` | Dark forest green logo, gold tree emblem, moody omakase feed |
| kenshobangkok | `#E8A84C` | `#F2C4B0` | `#E85A2A` | `#F5EDD8` | `#2A2A2A` | Warm orange-gold gradient logo, rainbow ring border, editorial food feed |
| thespacebkk | `#1A1A1A` | `#F2B8B8` | `#E89898` | `#FFFFFF` | `#1A1A1A` | Clean black logo on white, blush pink accents, minimal B&W pilates feed |
| dog_in_town | `#1A1A1A` | `#D4A050` | `#FFFFFF` | `#F5F0E0` | `#1A1A1A` | Black circle logo with white Husky illustration, warm honey/tan dog fur tones |
| unfashion_vintagecollection | `#8B5E3C` | `#E8DCC8` | `#4A5C3A` | `#A0785A` | `#1A1A1A` | No text logo, earthy cognac leather, cream garments, vintage market vibe |
