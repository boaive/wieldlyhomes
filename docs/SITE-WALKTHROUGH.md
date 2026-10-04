# Wieldy Homes — site walkthrough

What the website shows, in the order a visitor sees it: every screen, every 3D object and every animation. Written against the code as of V1 (2026-10-01). Timings marked "%" are scroll progress inside that chapter.

---

## 1. How the site is put together

**One page, one camera.** A single WebGL canvas is fixed behind the whole page. The page content ("chapters") scrolls over it. Scrolling does not move the page past pictures — it moves a camera through 3D scenes, and text fades in over the top.

**Layers, back to front**

| Layer | What it is |
| --- | --- |
| Canvas | The 3D scene, full viewport, fixed |
| Veil | A navy sheet that fades in and out to hide scene changes |
| Vignette | A soft darkening at the top and edges |
| Callouts | Small technical labels pinned to points on the 3D objects |
| Chapters | The text, buttons and drawing sheets |
| Rail | Eleven thin ticks on the right edge (desktop) — one per step, the current one lime |
| Navigation | Logo + Experience / Modular Precast / Future / Contact |

**Look**

- Colours: deep navy `#0B1720`, warm ivory `#F1EEE5`, concrete grey, timber, and Wieldy lime `#A8C64A` used only for small markers (active tick, beat number, connection points).
- Type: Manrope in large uppercase for headlines, Instrument Sans for sentences, IBM Plex Mono for small spaced-out labels.
- 3D style: an architectural model at dusk. Matte concrete, dark steel, glass, timber; one soft key light with shadows; warm light inside the modules; a faint pool of light on a dark floor under whatever is being shown. No glow, bloom or neon.

**Screen layout of a typical chapter (desktop)**

```
┌──────────────────────────────────────────────────────────────┐
│ W Wieldy Homes            EXPERIENCE  MODULAR PRECAST  FUTURE [CONTACT] │
│ 02 / OFF-SITE CONSTRUCTION                                            ─ │
│                                                                       ─ │
│                                   ┌───────────────┐                   ━ │ ← rail
│                                   │   3D subject  │                   ─ │
│                                   │ (right ⅔)     │                   ─ │
│ 03                                └───────────────┘                     │
│ ENGINEERING                                                            │
│ Lightweight forming and          ┌ DESIGN │ PLANNING │ ENGINEERING … ┐ │
│ reinforced panels …              └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Label top-left, headline and one or two sentences bottom-left, step strip bottom-right, 3D subject shifted to the right so text never sits on it. On phones the subject moves to the top half and the text to the bottom, with a thin progress line under it.

---

## 2. Animation system (applies everywhere)

| Animation | What the visitor sees | How it works |
| --- | --- | --- |
| Loader | Logo, "WIELDY HOMES", a thin lime bar, "INITIALIZING EXPERIENCE · 03/04" | Four real milestones: fonts, 3D engine downloaded, first scene compiled, first frame drawn. Fades out over 0.9 s |
| Camera travel | Scrolling glides the camera; it never snaps | Each scene defines camera keyframes along scroll progress; the camera eases toward the target (about half a second to settle) |
| Idle drift | A very slight float even when not scrolling; on desktop the view leans a little toward the mouse | Small sine motion plus pointer parallax, strongest on the hero |
| Lens shift | The subject sits right of centre (desktop) or above centre (phone) | The projection is offset rather than the camera turned, so verticals stay straight |
| Text beats | A headline fades up 16 px as the previous one fades out | CSS, 0.45 s out / 0.65–0.85 s in |
| Appear | Parts fade in and settle downward ~30 cm as they arrive | Opacity + small drop, driven by scroll |
| Callouts | Mono labels with a short lime tick, attached to a point on the model | Re-projected to the screen every frame |
| Veil | The picture dips to navy and comes back on a different scene | At five chapter boundaries and twice inside the transport chapter |
| Hoist lift | A module rises, travels, lowers: up for the first third, across the middle, down for the last third | Same motion in the configurator (timed) and transport (scroll-scrubbed) |
| Reduced motion | No camera travel: the view dips to dark and reappears at the next step; lifts are instant | Follows the system setting |

Scroll never gets hijacked: it is the browser's own scroll; the tall chapters simply give the camera room to move.

---

## 3. The 3D objects

**The capsule (the product)** — used in the yard, configurator, layouts, transport and site.

- Two sizes: Base 3 × 3 × 3 m, Extended 6 × 3 × 3 m.
- Light concrete shell, 20 cm walls, flat dark roof with four small galvanised lifting anchors.
- Front: a large floor-to-head glazed opening with slim dark frames and mullions, plus a panel of vertical timber slats. The extended capsule also has a small square window.
- Back: a high horizontal strip window. Left end: a tall slit window. Right end: solid.
- Inside, seen through the glass: timber floor, a warm light strip on the ceiling, a softly lit lining.
- Where two capsules touch, both leave that face open, so combined capsules read as one space.

**The layered module** — the explainer version of the extended capsule (factory, reveal, Why Wieldy, construction story). Same outside, but built from separate layers that can each be shown or hidden:

| Layer | Looks like |
| --- | --- |
| Frame | Galvanised posts, rails, floor joists and roof purlins |
| Insulation | Pale yellow core filling the walls, floor and roof |
| Services | Brass electrical conduit with dark switch boxes, a distribution board, blue-grey plumbing |
| Formwork | Green panels with timber walers and raking steel props, in two halves (back + left, front + right) |
| Concrete | The grey outer skin; can "pour" (rise from the floor up) or turn see-through |
| Lining | Light inner surface |
| Envelope | Glazing, timber slats, roof membrane, anchors |
| Fit-out | Timber floor, tiled wet zone, partition, cove light |
| Furniture | Bed with headboard and pillows, wardrobe, rug, brass pendant, vanity with basin, mirror, glass shower screen |

**Machines**

- *Overhead hoist*: a steel spreader frame, four short slings to the roof anchors, two cables rising out of the top of the picture.
- *Flatbed truck*: graphite cab with a thin ivory stripe and two small headlights, 12 m trailer, dark wheels.
- *Mobile crane*: graphite carrier on four axles with outriggers down, a slewing upper body, an ivory boom with a telescoping grey section, a cable, hook and four slings. The boom aims itself at whatever it is lifting.

**Site parts, generated from the configuration** — footing pads, short concrete piers and plinth beams under every ground-level cell; a timber deck in front of each column of the building; four timber steps; a slim steel pergola with timber slats over the deck; a thin dark roof plate with a small overhang.

**Set dressing** — dark floor with a faint 3 m grid; additive pools of light; thin dimension lines with end ticks; a flat grey cut-out person (the kind placed in architectural models); tall cypress-like trees; soft hills; a gradient dusk sky with a band of afterglow on the horizon.

Everything is procedural placeholder geometry. Real models replace it through `src/config/assets.ts`.

---

## 4. Chapter by chapter

Lengths are in screen heights of scrolling.

### 01 · Enter Wieldy (first ~7% of a 7.6-screen chapter)

**Screen:** label "01 / ENTER WIELDY"; headline **CONSTRUCTION, / MADE WIELDY.** very large, bottom-left; "A modular construction system engineered from factory to site."; a bordered button "EXPLORE THE SYSTEM ↓"; bottom-right "MODULAR PRECAST / 3×3 · 3×6".

**Scene:** dusk. A long, dark, ribbed factory building fills the right two-thirds. A thin warm band of light runs under its roof line. A lit doorway with a pale steel portal frame and a canopy shows the hall inside, with finished capsules visible. "WIELDY HOMES" in spaced ivory letters on the façade, "MODULAR PRECAST" beneath. A tall lamp post on the left. On the right, finished capsules standing on bearers and a truck with a capsule loaded. Guide lines painted on the apron lead to the door, where a warm pool of light spills out. The sky is near-black navy with a rust-coloured glow low on the left.

**Motion:** the camera sits low and far back, drifting slightly and leaning with the mouse. The button scrolls smoothly to the factory.

### 02 · Off-site construction (rest of the same chapter)

**Approach (7–16%)** — the text fades out and the camera travels forward and through the doorway in one continuous move. Lighting changes from dusk to interior.

**Title (16–29%)** — "02 / OFF-SITE CONSTRUCTION"; headline in four lines **BUILD / WHERE / CONTROL / MATTERS.**; "A controlled environment for consistent quality, efficient production and reduced on-site variability." The hall recedes into darkness: dark walls with a low concrete dado, steel columns, roof trusses, rows of bright linear lights, an overhead crane, painted aisle lines, the five stations down the left and a row of finished capsules along the right wall.

**Five stations** — the camera moves down the aisle and settles at each bay, which is outlined on the floor with a painted number. The step strip bottom-right reads DESIGN · PLANNING · ENGINEERING · MANUFACTURING · CONSTRUCTION with the current one underlined in lime.

| # | At | Headline | In the bay |
| --- | --- | --- | --- |
| 01 | 36% | DESIGN | The module as a thin ivory wireframe; a white plan table with a drawing sheet; a cut-out figure beside it |
| 02 | 49% | PLANNING | Steel base jigs laid out on the floor in an L, with faint wireframe volumes above them |
| 03 | 62% | ENGINEERING | The galvanised structural frame alone, on black bearers |
| 04 | 75% | MANUFACTURING | Frame, yellow insulation and services inside an open green form (back and one end), concrete poured about 60% of the way up; a figure for scale |
| 05 | 89% | CONSTRUCTION | The finished capsule on its bearers |

### 02 · Controlled environment — the sectional reveal (3.8 screens)

**Screen:** "02 / CONTROLLED ENVIRONMENT"; **ONE MODULE. / A COMPLETE / SYSTEM.**; "Every capsule leaves the factory as a finished, engineered volume." Then four beats: A STRUCTURE, B INSULATION, C SERVICES, D INTERIOR.

**Motion:** the camera slowly circles the finished module and rises from 2.6 m to about 6 m while the factory dims and fog closes in, leaving the module in a pool of light. Between 14% and 58% a corner of the module is cut away — the front, right end and roof on the near corner. The cut is staggered: concrete steps back furthest, insulation less, lining least, so the wall build-up reads as three stepped layers with flat ivory and yellow cut faces. The steel frame, the conduits and the furnished interior stay visible inside the opening. Nothing is pulled apart. A callout names each layer as its beat arrives.

*The picture dips to navy.*

### 03 · Why Wieldy (5.2 screens)

**Screen:** "03 / WHY WIELDY"; **SIX REASONS, / ONE MODULE.**, then six beats. Scene: the module alone on a dark studio floor with a faint grid.

| # | Headline | What happens to the module |
| --- | --- | --- |
| 01 | CONTROLLED | Dimension lines appear on the floor and up one corner, labelled 6 000 / 3 000 / 3 000 mm |
| 02 | INSULATED | The concrete turns almost transparent, exposing the yellow insulated core and frame. Callout: "Insulated core — Aerogel · PIR · Glass wool" |
| 03 | MODULAR | A base capsule slides in from the right and stops flush against the end. Callout: "3×6 + 3×3 — One connection" |
| 04 | LIGHTER | The hoist appears and lifts the module about 1.8 m. Callout: "½× — Weight of precast concrete" |
| 05 | SCALABLE | Four more capsules settle on top one after another; the camera pulls far back to show a five-storey stack. Callout: "05 Storeys" |
| 06 | SITE-READY | The stack clears; the module sits on concrete piers on a gravel pad, then a deck and steps appear. Callout: "30–60% Faster build" |

### 03 · The system, compared (ivory section, normal scrolling)

The only light-coloured section before Contact: an ivory "paper" page in navy ink.

- Headline **PRECAST, / WITHOUT THE WEIGHT.**
- Three large figures in a ruled row: **30–60%** Faster build · **½×** Weight of precast concrete · **4 hr** Fire rated — and a fourth cell: Thermally insulated / Sound proof.
- A two-column table: *Wieldy Homes system* against *Traditional precast concrete* (struck through, greyed): Flexible forming / Heavy molds · Design freedom / Design limitations · Simple lifting equipment / Large lifting equipment · No heavy transport / Heavy transport vehicles · Low entry barriers on site / Large setup, high entry barriers · Cost-efficient per module / Premium pricing.
- Six numbered principles in three columns: Small and micro infrastructure · Foundation to finish · Energy-efficient by design · Easier to modify · An integrated ecosystem · Predictable budgets.

### 04 · Construction story (8.2 screens, nine stages)

**Screen:** "04 / CONSTRUCTION STORY" and a counter "06 / 09" top-right; a very large thin stage numeral, the stage name, one sentence, a row of small mono tags; nine short ticks bottom-right.

**Scene:** two places on one dark floor — a site plot (earth and gravel pad) and, 20 m to the left, a factory casting bed (dark slab with a painted outline and three bearers).

| Stage | Tags | What is built, in order |
| --- | --- | --- |
| 01 FOUNDATION | Footing · Plinth · Piers | On the site: footing pads, then piers, then plinth beams fade in |
| 02 SHELL | Structural shell | Camera travels to the factory bed; the steel frame appears |
| 03 INSULATION | Thermal insulation | Yellow insulation fills the frame |
| 04 SERVICES | Electrical · Plumbing · Mechanical | Brass conduit and plumbing appear |
| 05 FORMING | Green formwork | The back half of the green form closes, then the front half |
| 06 CASTING | Concrete mixer · Concrete pump · Casting | A mixer truck and an articulated placing boom arrive; the form turns semi-transparent and concrete rises inside it from floor to roof; then the form fades away |
| 07 FINISHING | Flooring · Joinery · Tiles · Electrical · Plumbing · Fixtures | Lining, glazing, slats, floor and tiles, then furniture |
| 08 INSTALLATION | Lifting · Transportation · Installation · Deck · Stairs · Shades · Roof | The hoist lifts the module 5.4 m, carries it across to the foundation and lowers it, the camera following; then deck, stairs, shade pergola and roof appear in turn |
| 09 HABITAT | Finished environment | Light turns warm and low; two chairs and a figure appear on the deck |

*The picture dips to navy.*

### 05 · Modular Precast (3.8 screens)

**Screen:** "05 / MODULAR PRECAST"; **TWO MODULES. / MULTIPLE / POSSIBILITIES.**; "Every Wieldy Homes project is built from two standardized precast concrete capsules."; two spec blocks — BASE CAPSULE 100 sq ft, 3m × 3m footprint · EXTENDED CAPSULE 200 sq ft, 6m × 3m footprint.

**Scene:** both capsules side by side on bearers on the studio grid, seen from a high three-quarter view.

| Beat | Camera and model |
| --- | --- |
| A BASE CAPSULE | Camera moves in on the small capsule; floor dimensions 3 000 × 3 000; callout "100 sq ft" |
| B EXTENDED CAPSULE | Camera moves to the long capsule; 6 000 × 3 000; callout "200 sq ft" |
| C COMBINED | The base capsule slides across and joins the end of the extended one; callout "27 sqm — Two units · ≈290 sq ft"; a strip lists Single unit 18 sqm · Two units 27 sqm · Combined 36 sqm · Extended 54 sqm |

### 05 · Layouts (2.5 screens)

**Screen, three columns:**

- Left: "05 / LAYOUTS", **PRE-ENGINEERED / LAYOUTS.**, a size selector **200 · 300 · 400 · 600** sq ft (the chosen one bright with a lime bar), option tabs (Option 1 / 2 / 3), a facts list (Footprint, Capsules, Catalogue elevation) and the button "CONFIGURE THIS LAYOUT →".
- Centre: the 3D arrangement of capsules for that size on a dark plinth, seen from above at an angle.
- Right: an ivory sheet with an architectural floor plan — thick black outer walls, thin partitions, door swings as quarter arcs, windows as triple lines, beds, WCs, basins, counters and sofas in thin linework, decks hatched, gardens dotted, room names in small capitals, and overall dimensions in feet with end ticks.
- Bottom: "ONE SYSTEM — Villas & farmhouses · Commercial spaces · Industrial structures · Healthcare & education · Modular housing projects · Portable houses".

**Motion:** changing size cross-fades the 3D arrangement (old one fades down, new one settles in) and redraws the plan; the camera stands further back for larger layouts. The button loads that arrangement into the configurator and jumps there.

Nine plans: 200 (2 options), 300 (3), 400 (2), 600 (2).

*The picture dips to navy.*

### 06 · Configure (3 screens)

**Screen, two columns:**

- Left (the 3D viewport): "06 / CONFIGURE", **PICK. PLACE. / COMBINE.**, "Select a module and place it on the grid. The plan follows." At the bottom: MODULES — two buttons **3×3 Base capsule · 100 sq ft** and **3×6 Extended capsule · 200 sq ft**; LEVEL — − Ground +; CONFIGURATION — **+ ADD MODULE**, **ROTATE · FRONT**, **REMOVE**, **RESET**; one status line.
- Right: an ivory sheet "PLAN · GROUND" with the live floor plan, a row "CATALOGUE LAYOUTS 200 300 400 600", a summary (Modules, Area, Storeys, Footprint) and "REQUEST A QUOTE →".

**Scene:** a dark pad with a white border and a 6 × 4 grid of 3 m cells. To its left a small dock holding one of each capsule on bearers, labelled "3×3 Base capsule" and "3×6 Extended capsule". Lime ring-and-cross markers show where a module can go.

**What the visitor can do**

| Action | Result |
| --- | --- |
| Pick a size | The first module goes straight to the centre of the grid |
| Click or tap a lime marker (in 3D or on the plan) | The capsule rises off the dock on the hoist, travels over, lowers and sits down (2.4 s). The dock capsule fades back in afterwards |
| Hover a marker | A lime outline shows where the capsule would sit |
| + Add module | Places at the best free marker — no aiming needed on a phone |
| Click a module | Lime outline; markers now show where it can move (1.9 s lift) |
| Rotate | Lifts 1.4 m, turns a quarter, lowers (1.5 s). The glazed front turns with it |
| Level + | Markers move onto the roofs; modules stack up to five storeys |
| Remove | The hoist carries it back to the dock (1.7 s) |
| Reset | Everything lifts away in quick succession |
| Catalogue layout | Clears the pad and builds that arrangement module by module |
| Drag sideways | Turns the view; vertical swipes still scroll the page |

Rules: a module must touch another on the ground or rest fully on the level below; nothing can be moved, turned or removed while something sits on it; 12 modules maximum.

**The plan** is drawn from the same list of modules, so it changes at the same instant: thick black lines are solid walls, a double line is the glazed front, a dashed line is an open joint between two capsules, levels below are dashed outlines. Overall width and depth in metres sit outside the drawing. The same markers are real buttons there, so the configurator works by keyboard and without 3D.

### 07 · Transport → Site → Installation (6.4 screens)

**Screen:** "07 / TRANSPORT → SITE → INSTALLATION"; top-right a lime-dotted tag **YOUR CONFIGURATION** (or SAMPLE CONFIGURATION if nothing was placed) with a one-line summary; five beats.

| Beat | Scroll | What happens |
| --- | --- | --- |
| 01 LIFT | 0–28% | Still on the configurator pad. A truck drives in and parks in front. The hoist picks the modules up one at a time — top levels first — and sets them on the trailer. The truck drives off; another arrives if the load needs it (12 m of trailer each) |
| 02 TRANSPORT | 28–48% | Dip to navy, then a road at dusk: asphalt with white edge lines and centre dashes, dark cypress trees on both sides, soft hills, an amber band on the horizon. The camera starts ahead of the truck and ends alongside the trailer |
| 03 SITE | 48–56% | Dip to navy, then the site from high up: gravel pad, an access lane, the foundation already laid out to match the configuration, the mobile crane with its outriggers down, trees and hills behind. The truck pulls in |
| 04 PLACEMENT | 56–84% | The crane boom swings to each module, lifts it off the trailer and sets it on its piers — ground level first. The camera slowly descends and closes in |
| 05 FINISH | 84–100% | Deck, steps, shade pergola and roof appear in that order; the camera ends low, in front of the finished building |

*The picture dips to navy.*

### 08 · Interior (4.6 screens)

**Screen:** "08 / INTERIOR"; **FINISHED / AS ONE SPACE.**, then five beats. The camera walks through at eye height and always passes through door openings, never walls.

| Stop | What is in view |
| --- | --- |
| Arrival | From the deck: two low timber chairs, the glazed front with the sliding door open, the lit interior beyond |
| 01 LIVING | An ivory sofa with two cushions against a fluted timber wall, a round low table, a pale rug, a brass cone pendant, timber plank floor, exposed concrete ceiling |
| 02 KITCHEN | A pantry counter on the living wall: timber fronts, stone top, a dark sink with a brass tap, tiled splashback, an open shelf with cups and a light strip beneath |
| 03 BEDROOM | A bed with headboard and two pillows, bedside tables with a small lamp, a full-height timber wardrobe, a window with a curtain |
| 04 BATHROOM | Tiled walls and floor, a floating vanity with a round basin and brass tap, a mirror with a light above, a WC, a glass shower screen |
| 05 DECK | Looking out through the glazing: deck boards, pergola slats overhead, chairs, cypress trees, hills and the dusk sky; a figure standing on the lawn |

Low warm light comes in from the deck side and throws the mullion shadows across the floor.

*The picture dips to navy.*

### 09 · Labour Precamp and 10 · Capsule House (2.2 screens each)

**Screen:** "09 / FUTURE OFFERING" (or 10), a bordered chip **● COMING SOON** top-right, the name very large (**LABOUR / PRECAMP**, **CAPSULE / HOUSE**), one paragraph ending "Presented here as a concept.", the button "REQUEST CATALOGUE →", and bottom-right "CONCEPT MODEL / NOT YET AVAILABLE TO CONFIGURE".

**Scene:** a pale clay model with drawn edges on the studio floor — deliberately less finished than the capsules.

- *Labour Precamp*: a two-storey block of five bays on short piers, a door and window per bay, galleries with slim posts and rails on both levels, a stair at one end, a single-pitch roof.
- *Capsule House*: one long shell with chamfered edges on piers, a wide dark glazed front, a door with steps, and a balcony at one end with a glass rail under a roof overhang.

**Motion:** the camera makes a slow quarter-orbit as the chapter scrolls. Moving from 09 to 10 cross-fades the two models.

**Request catalogue** opens a centred navy dialog over a blurred page: "● COMING SOON", "LABOUR PRECAMP CATALOGUE", fields Name / Company / Email / Phone, button "REQUEST CATALOGUE →". Closes with ✕, Esc or a click outside.

### 11 · Contact (normal scrolling)

**Screen, two columns on a slightly lighter navy:**

- Left: "11 / CONTACT"; **BUILD WITH / WIELDY.**; "Share your location and requirements. A fixed estimate typically follows within a day."; Email sales@wieldyhomes.com; Phone +91 74163 00561.
- Right: two large tabs — **01 I HAVE A PROJECT** and **02 I WANT TO PARTNER** (the active one ivory with a lime underline). Underlined fields: Name, Company, Email, Phone, Location, then Requirement (a list) and Approximate size / number of units for a project, or Partnership interest for a partner; Message; a solid ivory button. If a configuration exists, a tick box "Include my configuration" with its summary. A small note on cost below.

Submitting opens the visitor's mail app with the enquiry filled in, and the form says exactly that ("Enquiry prepared … send it from there").

**Footer:** logo, "Wieldy Homes", "Construction, made wieldy." in lime, the descriptor line, email and phone, "© 2026 Wieldy Homes — All rights reserved." and "Digital experience crafted by BOAIVE · Float Your Thrive".

---

## 5. Visitor workflow

1. Loader → hero.
2. Scroll: exterior → door → five stations → sectional reveal → six advantages → comparison page → nine construction stages → the two capsules → catalogue layouts.
3. Configure a building (or load a catalogue layout).
4. Keep scrolling: that building is loaded, driven, craned and finished.
5. Walk through the interior.
6. Two future products → request a catalogue.
7. Contact as a customer (configuration attached) or as a partner.

Shortcuts: the four nav links and the eleven rail ticks jump straight to a chapter; "Request a quote" in the configurator jumps to Contact with the configuration ticked.

## 6. Technical workflow (per frame)

1. Each chapter reports its scroll progress (0–1) and which chapter is centred.
2. The director picks the scene for that chapter and keeps the neighbouring scenes loaded but hidden.
3. The scene's definition returns a camera pose and a lighting set-up for that progress.
4. The rig eases the camera and lights toward them and applies the lens shift.
5. The scene's own parts read the same progress and set their opacity, position, cut planes and so on.
6. Callouts are re-projected; the veil opacity is set.

Scenes: `factory` (01–02 and reveal) · `module` (03) · `story` (04) · `system` (05 and layouts) · `config` (06 and the loading part of 07) · `route` (road and site) · `habitat` (08) · `future` (09–10).

## 7. Other screen sizes and fallbacks

- **Tablet landscape:** two columns stay; controls stack.
- **Phone / portrait:** 3D on top, text below; hamburger menu opening a full-screen list (01 Experience … 04 Contact with email and phone at the bottom); layouts and configurator stack as 3D → sheet → controls.
- **Phone on its side:** type and spacing compress so nothing is cut off.
- **No 3D available:** the canvas is replaced by an isometric line drawing for each chapter, with the note "Static view · 3D is unavailable on this device". All text, plans and the plan-based configurator still work.
- **Low-power devices:** shadows off and resolution reduced automatically.

## 8. Current state

Built and working: everything above. Checked at 1440, 1920, 1366, tablet, 390, 430 and 844×390 — no sideways scrolling, no console errors, 60 fps on integrated graphics.

Still placeholder or open: all 3D is procedural (no real models or photos yet); forms hand off to the mail app (no server); the BOAIVE credit has no link; floor plans are redrawn from the catalogue and marked indicative; no pricing; no projects section.
