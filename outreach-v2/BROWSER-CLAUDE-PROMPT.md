# Browser Claude — Color Extraction Prompt

Copy and send this to Claude in your browser when you're ready to extract colors for a new round.

---

## The Prompt

```
I need you to extract brand colors from Instagram accounts and submit them to my local outreach tool.

For each account listed below, please:
1. Go to their Instagram profile
2. Analyze their color palette from their logo, feed, highlights, and brand graphics
3. Navigate to: file:///C:/Claude%20Code/outreach-v2/launcher.html
4. Click the "⬡ Colors" button in the toolbar
5. Fill in the Round number, the Instagram handle, and the 5 color fields (Primary, Secondary, Accent, Bg, Text)
6. Add any notes about logo style or feed vibe
7. Click "Submit Colors →"
8. Confirm it shows "Submitted ✓" before moving to the next account

Accounts to process (Round [N]):
- @[handle1]
- @[handle2]
- @[handle3]
- @[handle4]
- @[handle5]

Color field guidance:
- Primary: dominant brand color (logo, key UI elements)
- Secondary: second most used brand color
- Accent: highlight/CTA color
- Bg: the background color that best represents their brand (cream, white, black, etc.)
- Text: primary text color (usually dark on light bg, light on dark bg)

After all accounts are submitted, tell me you're done.
```

---

## Notes
- The color server must be running: `node color-server.cjs` in `outreach-v2/`
- The launcher must be open as a `file://` URL (not served by a server)
- Each submission auto-applies colors to the matching mockup and re-screenshots
- Mockups must use CSS custom properties (`:root { --brand-primary: ... }`) for auto-apply to work
