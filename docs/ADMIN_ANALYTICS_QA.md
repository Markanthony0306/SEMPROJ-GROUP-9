GATE: FAIL 38 (round 1 of 3)

# FitPulse analytics verification

The requested analytics implementation is complete. The broader design gate remains open: its marketing-page rules conflict with preserving an authenticated dashboard and using a consistent chart wrapper. Existing shell contrast/focus and fixed mobile navigation findings also remain open. No waivers or unrelated shell redesign were applied.

Kind: software, an existing gym admin portal. The requested navy/red/orange/gold palette and existing Fredoka/Nunito fonts, shell, hero, and clay surfaces were retained. No new photographs, assumed business facts, brand names, marketing effects, scenes, or creative moments were added. Preview numbers are isolated test fixtures, not production fallback data.

## Verification completed

- 13 focused API, aggregation, pagination, authentication, and route-regression tests passed.
- Production build passed; the existing camera/runtime chunk-size warnings remain.
- Read-only live Supabase checks verified all four aggregate queries; no records/schema were changed.
- Source formatting and focused Git whitespace checks passed.
- Browser checks used the actual dashboard components with a separate local fixture server and Chart.js 4.4.7 from the pinned CDN.
- Screenshots at 1440, 1024, 820, 768, 390, and 320 pixels were inspected. Mobile charts scroll within the existing app shell.
- Theme changes destroyed old chart instances and rebuilt them with updated CSS colors. Unmount/remount left no duplicate canvas ownership.
- Empty, loading, API failure/retry, malformed responses, partial failure, and unavailable CDN states passed.

## Browser assertion runs

| Width | State | Theme | Result | Assertions |
| --- | --- | --- | --- | --- |
| 1440 | loaded | light | PASS | 15 |
| 1024 | loaded | dark | PASS | 10 |
| 390 | loaded | light | PASS | 15 |
| 820 | empty | light | PASS | 8 |
| 768 | error | light | PASS | 9 |
| 320 | loading | light | PASS | 8 |
| 390 | cdn-error | light | PASS | 8 |
| 390 | invalid | light | PASS | 9 |
| 390 | partial | light | PASS | 13 |
| 390 | loaded | dark | PASS | 13 |
| 1440 | loaded | light | PASS | 13 |
| 1440 | loaded | light | PASS | 13 |
| 1440 | loaded | light | PASS | 13 |
| 390 | loaded | light | PASS | 13 |
| 1280 | loaded | light | PASS | 13 |
| 1152 | loaded | light | PASS | 13 |
| 1024 | loaded | light | PASS | 13 |
| 896 | loaded | light | PASS | 13 |
| 768 | loaded | light | PASS | 13 |
| 320 | loaded | light | PASS | 13 |

## Checker limits and open findings

The skill's separate layout/check.mjs could not run: no Chrome found (set CHROME_PATH). Its screenshot and consistency scripts did run with installed Edge. No performance pass is claimed. The consistency quick run did not check: scroll-linked (stepping); scroll-reveal (the reveal walk; IntersectionObserver reveals are read); hover-spill; hidden-visual; loop-pause; forms; reduced-motion; the dead-IntersectionObserver walk (hidden content is read with scripts off and under reduced motion); hover-move.

No waivers were added. All 38 open gate findings follow, including genuine existing shell findings; they are not silently treated as passes.

### hero-fill (1440px)

Location: section#view "Let’s keep the momentum going."

the next section shows on the first screen: it starts at 116px on a 900px screen (the hero ends at 100px)

Suggested checker fix: let the hero fill the first screen alone (min-height: 100svh, less above it): nothing of the next section on load

### nav (1440px)

Location: div.app.admin-app > main > header.clay > button.chip "Analytics QA Administrator AQ"

nav link wraps to a second line

Suggested checker fix: make the nav one bar from the content's left edge to its right edge, with every link and action inside it

### card-family (1440px)

Location: section#view > div.admin-analytics > section.analytics-stats > article.clay.analytics-stat:nth-of-type(1) "Total members"

11 cards of one kind (.clay) set their titles in 2 faces: nunito (4, like "Total members"), fredoka (6, like "QR Attendance")

Suggested checker fix: draw one card part one way: one fill and one title face for every card of a kind (one featured card may differ)

### card-layout (1440px)

Location: section#view > div.admin-analytics > section.analytics-grid "QR Attendance Current week · Monday–Sund"

4 of 4 cards drawn one way (one panel, ground, placement and fragment): copies of one card

Suggested checker fix: a card layout at most twice on a page: build the other sections another way

### button-styles (1440px)

Location: (one screen)

3 button styles on one screen: round, fill gradient ("Dashboard"); pill, fill gradient ("Add a member"); pill, fill #f5f8fd ("Explore reports"); the odd one out: "Explore reports"

Suggested checker fix: one primary and one secondary button: one shape, one height per size, one label size

### cta (1440px)

Location: div#root > div.app.admin-app > main > header.clay

the hero has no button (the nav's does not count)

Suggested checker fix: add the action: a button in the hero, one on every priced item, one in the closing section

### copy-headline (1440px)

Location: div.app.admin-app > main > header.clay > h1 "Dashboard"

"Dashboard" does not name what is sold (gym administration, gym, administration, from flags); only the line under it does

Suggested checker fix: put the category noun in the h1 (and who it is for, or where), in 2 to 8 words

### heading-scale (1440px)

Location: section#view > section.card.clay > div > h2 "Let’s keep the momentum going."

h2 headings in 3 sizes, 12px ("Total members") to 32px (x2.67)

Suggested checker fix: size headings by level: the h1 largest, one size per level, each level below the one above

### contrast (1440px)

Location: main > header.clay > button.chip > span.av "AQ"

body text over a effect reads at 2.0:1 at its worst tenth (needs 4.5:1)

Suggested checker fix: put the text on a calm part of the picture, or on a solid panel

### contrast (1440px)

Location: section#view > section.card.clay > div > p "Welcome back, Analytics. Here’s how your"

body text over a picture reads at 4.3:1 at its worst tenth (needs 4.5:1), on a busy ground

Suggested checker fix: put the text on a calm part of the picture, or on a solid panel

### text-contrast (1440px)

Location: div.app.admin-app > aside.clay > div.logo.brand > span "Pulse"

a caption, label or muted line in #f77f00 on #f5f8fd reads 2.47:1 (needs 3:1)

Suggested checker fix: body text in the ink at 7:1 or more; grey (4.5:1 or more) only for captions and labels

### text-contrast (1440px)

Location: section.grid.g2 > article.card.clay:nth-of-type(2) > div.admin-card-heading > span.pill.p-warn "0"

a caption, label or muted line in #ffffff on #f77f00 reads 2.63:1 (needs 4.5:1)

Suggested checker fix: body text in the ink at 7:1 or more; grey (4.5:1 or more) only for captions and labels

### focus-visible (1440px)

Location: div#nav > button.nav.on:nth-of-type(1) "Dashboard"

Tab stop 1, button "Dashboard": its focus change is faint: 1.83:1 against the ground, 3:1 needed

Suggested checker fix: keep the kit's ring (system.css :focus-visible, 2px in --action, there at once); a control that hides itself shows on focus

### focus-visible (1440px)

Location: section#view > section.grid.g2:nth-of-type(2) > article.card.clay:nth-of-type(2) > button.admin-text-button "View all reminders →"

Tab stop 14, button "View all reminders →": its focus change is faint: 2.47:1 against the ground, 3:1 needed

Suggested checker fix: keep the kit's ring (system.css :focus-visible, 2px in --action, there at once); a control that hides itself shows on focus

### moment-none (1440px)

Location: (the page)

a software page (--type) deals no moment: every kind carries one, two on a long page (moments.md)

Suggested checker fix: deal one (moments.mjs pick --page software) and mount it in its own section

### hero-screen (1440px)

Location: div#root > div.app.admin-app > main > header.clay "DashboardAnalytics QAAdministratorAQ"

the hero ends at 100px on a 900px screen, 800px above the fold: it ends at the fold, 1px either way (SR-1)

Suggested checker fix: make the hero exactly one screen (height: 100svh, its content fitted inside), never taller or shorter

### hero-screen (1440px)

Location: div#root > div.app.admin-app > main > div.dashboard-stage "YOUR GYM, AT A GLANCELet’s keep the mome"

784px of the next section shows on the first screen (from 116px on a 900px screen): nothing below the hero shows at load (SR-1)

Suggested checker fix: end the hero at the fold so nothing of the next section shows at load (hero height: 100svh)

### section-height (1440px)

Location: div#root > div.app.admin-app > main > div.dashboard-stage "YOUR GYM, AT A GLANCELet’s keep the mome"

the section is 1630px tall (1.8 screens), 170px short of two screens (1800px): every section after the hero is one screen or two, 2px either way (SR-2)

Suggested checker fix: set the section to one screen or two (height: calc(var(--h,1) * 100vh), --h 1 or 2) and cut or split its content to fit

### one-section (1440px)

Location: div#root > div.app.admin-app > main > header.clay "DashboardAnalytics QAAdministratorAQ"

a <header> sits directly in <main>: every part of <main> is a <section> (SR-4)

Suggested checker fix: put every block of <main> in a <section>, and give a band its own section instead of a ground inside one

### one-section (1440px)

Location: section#view > section.card.clay "YOUR GYM, AT A GLANCELet’s keep the mome"

a band: a box 100% of the section wide on a ground of its own that holds the heading or the intro: the section's own ground is the band (SR-4)

Suggested checker fix: put every block of <main> in a <section>, and give a band its own section instead of a ground inside one

### one-heading (1440px)

Location: section.analytics-stats > article.clay.analytics-stat:nth-of-type(1) > div > h2 "Total members"

the section holds 11 h2 headings: one per section, first in its .wrap (SR-5)

Suggested checker fix: give each section one h2, first in its .wrap, and the hero only its h1

### container-edges (1440px)

Location: div#root > div.app.admin-app > main > header.clay "DashboardAnalytics QAAdministratorAQ"

the content of section 1 runs 285px from the left and 37px from the right (read from its outermost blocks: no .wrap): the page's container starts at 264px; 285 and 37px are not one margin; the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (SR-6)

Suggested checker fix: use one container on every section and the nav (.wrap): one margin left and right, 64-120px on a desktop, 16-24px on a phone

### container-edges (1440px)

Location: div#root > div.app.admin-app > main > div.dashboard-stage "YOUR GYM, AT A GLANCELet’s keep the mome"

the content of section 2 runs 264px from the left and 16px from the right (read from its outermost blocks: no .wrap): 264 and 16px are not one margin; the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (SR-6)

Suggested checker fix: use one container on every section and the nav (.wrap): one margin left and right, 64-120px on a desktop, 16-24px on a phone

### container-edges (1440px)

Location: div#root "FitPulseDashboardMembersEquipmentAttenda"

a <div> at the top of the page, outside header.nav, main, footer.closing and nav.actionbar (SR-6)

Suggested checker fix: build the page as header.nav, a main of sections (each one in-flow .wrap plus background layers) and footer.closing

### container-edges (1440px)

Location: section.analytics-stats > article.clay.analytics-stat:nth-of-type(4) > div > h2 "Revenue this month"

the h2 starts 947px right of the container's left: every h1 and h2 starts on it, 2px either way (SR-6)

Suggested checker fix: start the text on the container's left, or on the one split line every split shares

### container-edges (1440px)

Location: section.analytics-stats > article.clay.analytics-stat:nth-of-type(3) > div > h2 "Expiring soon"

the h2 starts 656px right of the container's left: every h1 and h2 starts on it, 2px either way (SR-6)

Suggested checker fix: start the text on the container's left, or on the one split line every split shares

### container-edges (1440px)

Location: section.grid.g2 > article.card.clay:nth-of-type(2) > div.admin-card-heading > h2 "Membership reminders"

the h2 starts 616px right of the container's left: every h1 and h2 starts on it, 2px either way (and 9 more like it: "Membership Status", "Payment Methods", "Check-ins this week") (SR-6)

Suggested checker fix: start the text on the container's left, or on the one split line every split shares

### hero-fill (390px)

Location: main.fitpulse-mobile-scroll > div.fitpulse-mobile-content > div.admin-analytics > section.analytics-grid "QR Attendance"

the next section shows on the first screen: it starts at 408px on a 844px screen (the hero ends at 392px)

Suggested checker fix: let the hero fill the first screen alone (min-height: 100svh, less above it): nothing of the next section on load

### flush (390px)

Location: div.fitpulse-mobile-content > div.admin-analytics > section.analytics-stats > article.clay.analytics-stat:nth-of-type(3) "Expiring soon 18"

its last line sits 0px above the lower edge of section.analytics-stats, where the ground changes to section.analytics-grid

Suggested checker fix: give the section its padding at the edge where the ground changes (the closing call keeps a clear gap above the footer)

### flush (390px)

Location: div.fitpulse-mobile-content > div.admin-analytics > section.analytics-grid > article.card.clay:nth-of-type(1) "QR Attendance Current week · Monday–Sund"

its first line sits 0px under the top edge of section.analytics-grid, where the ground changes

Suggested checker fix: give the section its padding at the edge where the ground changes (the closing call keeps a clear gap above the footer)

### spill (390px)

Location: div.app.admin-app > nav.fitpulse-bottom-nav > button.fitpulse-nav-primary > span.fitpulse-nav-primary-icon

runs 31px past the bottom edge of the panel it sits on (section.analytics-grid > article.card.clay:nth-of-type(1) > div.analytics-canvas > canvas)

Suggested checker fix: keep the box inside the panel it starts on: shrink it, or grow the panel to hold it

### overlap-text (390px)

Location: div#root > div.app.admin-app > nav.fitpulse-bottom-nav "Overview Members New member Activities M"

lies over the text "Membership Status" (div.analytics-chart-heading > h2)

Suggested checker fix: move the box off the text (or the text off the box)

### cta (390px)

Location: main.fitpulse-mobile-scroll > div.fitpulse-mobile-content > div.admin-analytics > section.analytics-stats

the hero has no button (the nav's does not count)

Suggested checker fix: add the action: a button in the hero, one on every priced item, one in the closing section

### cta (390px)

Location: div.app.admin-app > main.fitpulse-mobile-scroll > div.fitpulse-mobile-content > section:nth-of-type(2) "Recent activity"

the last section before the footer ends with no button

Suggested checker fix: add the action: a button in the hero, one on every priced item, one in the closing section

### heading-scale (390px)

Location: div.fitpulse-mobile-content > section:nth-of-type(1) > div.fitpulse-section-header > h2 "Expiring soon"

h2 headings in 3 sizes, 12px ("Total members") to 20px (x1.67)

Suggested checker fix: size headings by level: the h1 largest, one size per level, each level below the one above

### text-contrast (390px)

Location: div.app.admin-app > header.fitpulse-mobile-header > div.logo.brand > span "Pulse"

a caption, label or muted line in #f77f00 on #d5dfee reads 1.95:1 (needs 3:1)

Suggested checker fix: body text in the ink at 7:1 or more; grey (4.5:1 or more) only for captions and labels

### section-tile (390px)

Location: div.app.admin-app > main.fitpulse-mobile-scroll > div.fitpulse-mobile-content > section:nth-of-type(1) "Expiring soon"

the section is 82px tall (0.10 screens at 390x844), shorter than the screen: its tile, held at the page's end (scroll 0px) shows none of it and 721px of the section above, its heading "Total members" on screen

Suggested checker fix: set every section after the hero to one screen or two (height: calc(var(--h,1) * 100vh)) and fit its content above --padb

### section-tile (390px)

Location: div.app.admin-app > main.fitpulse-mobile-scroll > div.fitpulse-mobile-content > section:nth-of-type(2) "Recent activity"

the section is 82px tall (0.10 screens at 390x844), shorter than the screen: its tile, held at the page's end (scroll 0px) shows none of it and 721px of the section above, its heading "Total members" on screen

Suggested checker fix: set every section after the hero to one screen or two (height: calc(var(--h,1) * 100vh)) and fit its content above --padb

## Reproducing the preview

Run node .taste-skill/analytics-preview-server.mjs, then open http://127.0.0.1:5174/.taste-skill/analytics-preview.html. Query options include state=empty, state=loading, state=error, state=invalid, state=partial, state=cdn-error, theme=dark, and checks=1. Test fixture numbers never enter the production app. Close the preview server when done.
