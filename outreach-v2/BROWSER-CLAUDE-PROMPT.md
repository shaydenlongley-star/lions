# Browser Claude — Color Extraction Prompt

Copy the prompt below and paste it into Claude in your browser (claude.ai). The color server must be running first.

---

## Before You Start

1. Start the color server: `node color-server.cjs` in `outreach-v2/`
2. Confirm it says `Color server running on http://127.0.0.1:3457`
3. Copy the prompt for the current round below and send it to Claude in your browser

---

## Round 3 Prompt — Copy This

```
I need you to extract brand colors from Instagram accounts and submit them to my local outreach tool.

For each account listed below, please:
1. Go to their Instagram profile
2. Analyze their color palette from their logo, feed, highlights, and brand graphics
3. Navigate to: http://127.0.0.1:3457
4. Click the "⬡ Colors" button in the toolbar
5. Fill in Round: 3, the Instagram handle, and the 5 color fields
6. Add a short note about the logo style and feed vibe
7. Click "Submit Colors →"
8. Wait for "Submitted ✓" before moving to the next account

Accounts to process (Round 3):
- @kozueomakase — Japanese omakase restaurant, The Commons Thonglor
- @kenshobangkok — Japanese omakase on Sukhumvit 26
- @thespacebkk — Reformer pilates studio at SeenSpace Thonglor 13
- @dog_in_town — Dog cafe and hotel in Thonglor
- @unfashion_vintagecollection — Curated vintage store Bangkok

Color field guidance:
- Primary: dominant brand color (logo, key UI elements)
- Secondary: second most used color in the feed/branding
- Accent: highlight or CTA color (often a pop color used sparingly)
- Bg: background color that best represents their brand (cream, white, black, warm tan, etc.)
- Text: primary text color (usually dark on light backgrounds, light on dark)

After all 5 accounts are submitted, tell me you're done.
```

---

## Template for Future Rounds

When starting a new round, copy this template and fill in the handles:

```
I need you to extract brand colors from Instagram accounts and submit them to my local outreach tool.

For each account listed below, please:
1. Go to their Instagram profile
2. Analyze their color palette from their logo, feed, highlights, and brand graphics
3. Navigate to: http://127.0.0.1:3457
4. Click the "⬡ Colors" button in the toolbar
5. Fill in Round: [N], the Instagram handle, and the 5 color fields
6. Add a short note about the logo style and feed vibe
7. Click "Submit Colors →"
8. Wait for "Submitted ✓" before moving to the next account

Accounts to process (Round [N]):
- @[handle1] — [description]
- @[handle2] — [description]
- @[handle3] — [description]
- @[handle4] — [description]
- @[handle5] — [description]

Color field guidance:
- Primary: dominant brand color (logo, key UI elements)
- Secondary: second most used color in the feed/branding
- Accent: highlight or CTA color (often a pop color used sparingly)
- Bg: background color that best represents their brand (cream, white, black, warm tan, etc.)
- Text: primary text color (usually dark on light backgrounds, light on dark)

After all accounts are submitted, tell me you're done.
```

---

## What Happens After Submission

Each submission automatically:
1. Saves the colors to `incoming/r[N]-[handle].json`
2. Patches the matching mockup HTML (`mockups/round-[N]/[handle].html`) with the new colors
3. Re-runs the screenshot for that mockup

Mockup filenames must match handles (spaces/underscores stripped). If a mockup doesn't exist yet, the apply step logs an error but the JSON is still saved — mockup can be built later and colors reapplied manually with `node apply-colors.cjs incoming/r[N]-[handle].json`.
