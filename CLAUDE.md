# Wieldy Homes — 3D product experience website

Customer-facing scroll-driven 3D website for **Wieldy Homes** ("Construction, made wieldy."), built by BOAIVE.
Core product: **Modular Precast** (two capsules: Base 3m×3m / 100 sq ft, Extended 6m×3m / 200 sq ft).
Future products: **Labour Precamp**, **Capsule House** (coming soon, catalogue request only).

Keep this file current: when architecture, conventions, scope or status change, update the matching section and the changelog at the bottom.

## Commands

```bash
npm install        # once
npm run dev        # Vite dev server → http://localhost:5173
npm run typecheck  # tsc --noEmit (strict, noUnusedLocals)
npm run build      # typecheck + production build → dist/
npm run preview    # serve dist/
```

`.claude/launch.json` defines the `wieldy-dev` preview server.

QA query flags (combine with `&`): `?still` no camera damping/drift (use for screenshots) · `?reduced` force reduced-motion mode · `?nowebgl` force the static fallback · `?quality=low|mid|high` force a quality tier.

## Stack

Vite + React 19 + TypeScript (strict) · three.js via `@react-three/fiber` (no drei) · GSAP + ScrollTrigger · zustand · self-hosted fonts via `@fontsource` (Manrope display, Instrument Sans body, IBM Plex Mono labels).
Do not add dependencies without a clear need. No backend, no CMS, no admin panel in V1.

## Source of truth — do not invent product facts

- `assests/` (sic — the client's folder name; leave it) holds the source material: `Wieldy_Homes_Product_Catalogue_2.pdf`, `Wieldly Homes Meeting Summary  (1).pdf`, the legacy `prefab-house-price_3.html`, catalogue screenshots and handwritten notes. It is **not** shipped; nothing in `src/` imports from it.
- Every product fact, figure and term on the site comes from the catalogue or the meeting summary and lives in `src/content/copy.ts` and `src/content/plans.ts`. If a spec, number or certification is not in those documents, do not add it. Missing copy → conservative, non-technical wording. Missing engineering data → leave it out.
- Contact details are the catalogue's (`sales@wieldyhomes.com`, `+91 74163 00561`) in `src/config/site.ts`.
- Pricing is intentionally **not** shown (brief: no pricing-first experience). The CTA is a quote request.
- Forbidden copy: generic marketing lines ("future of construction", "revolutionizing", "unlock", "dreams into reality" …) and generic CTAs ("Get started", "Learn more").

## Scope rules (V1)

Narrative order is fixed: 01 Enter → 02 Off-site construction → 03 Why Wieldy → 04 Construction story (exactly 9 stages) → 05 Modular Precast (+ catalogue layouts) → 06 Configure → 07 Transport → Site → Installation → 08 Interior → 09 Labour Precamp → 10 Capsule House → 11 Contact.

- **No** projects / portfolio / case studies / testimonials. **No** admin, auth, CMS.
- Product model is **whole module → pick → place → combine**. Never model detachable walls or "Lego" wall interactions. The sectional reveal uses clipping planes and x-ray, not exploded walls.
- Transport and installation must use the **visitor's own configuration** (`shippedModules()` falls back to a clearly-labelled sample only when the grid is empty).
- The floor plan must stay generated from the same module list as the 3D (see Configurator).
- Future products are concept models with "Coming soon" + "Request catalogue" only — no configurator.
- Footer keeps the credit "Digital experience crafted by BOAIVE · Float Your Thrive". `studioCredit.url` is `null` until BOAIVE's official URL is confirmed — do not guess one.

## Architecture

One fixed full-viewport WebGL canvas sits behind the DOM. DOM "chapters" scroll over it and report progress; a director maps chapter + progress to a scene, camera pose and lighting.

```
src/
  config/     site.ts (brand, contact, nav, credit) · assets.ts (ASSET MAP — swap real assets here)
  content/    copy.ts (all text) · plans.ts (catalogue floor plans as data) · timeline.ts (scroll timelines shared by DOM + 3D)
  lib/        grid.ts (configurator rules) · shipping.ts (pick/place + truck choreography) · dimensions.ts (shared sizes, three-free)
              math.ts · device.ts · enquiry.ts
  state/      stage.ts (mutable `scroll` + zustand UI state) · config.ts (configurator store + flights) · plans.ts · enquiry.ts
  three/
    Experience.tsx        the single <Canvas>
    core/                 Stage.tsx (scene mounting, camera rig, light rig, veil) · director.ts · types.ts (Pose/Look/SceneDef)
                          builder.tsx (merged procedural geometry) · materials.ts · Appear.tsx · Callout.tsx · SkyDome.tsx
                          ModelSlot.tsx + GltfModel.tsx (real-asset swap point) · text.tsx
    objects/              shell.ts + Capsule.tsx (the product) · HeroModule.tsx (layered module) · machines.tsx (hoist, truck, crane)
                          siteKit.ts (foundation, deck, stairs, shades, roof from a configuration) · dressing.tsx
    scenes/               <name>.def.ts (camera + look, tiny, eager) and <Name>Scene.tsx (geometry, lazy) · registry.ts
  sections/   one component per chapter (Enter, Reveal, Why+Ledger, Story, Precast, Plans, Configure, Journey+Habitat, Future, Contact+Footer)
  ui/         Chapter.tsx (Chapter, BeatStack, Steps, Show, Title, Label) · Nav · Rail · Loader · PlanDrawing · ConfigPlan
              EnquiryForm · CatalogueDialog · Backdrop (no-WebGL fallback)
  styles/     base.css (tokens, type, layers, chapters, nav, loader) · sections.css
```

### How scroll drives 3D

- `ui/Chapter.tsx` wraps each section. Sticky chapters are tall tracks (`length` in viewport heights) with a 100svh sticky stage; flowing chapters (`ledger`, `contact`) are normal sections. Each writes `scroll.p[id]` (0→1) via ScrollTrigger and sets the active chapter.
- `scroll` in `state/stage.ts` is **mutable and non-reactive** on purpose — it is read inside the render loop. Do not move per-frame values into React state. Sections `setState` only when a discrete beat changes.
- `three/core/director.ts` → `sceneFor(chapter, p)` picks the scene. `Stage.tsx` keeps the active scene plus the adjacent chapters' scenes mounted, hides inactive ones, and dips a navy veil at chapter boundaries listed in `CUTS` (and wherever a scene def returns `veil`).
- Each scene def supplies `pose(ctx, out)` and `look(ctx, out)`. The rig damps toward them; lens shift (`shiftX/shiftY`) places the subject beside the text; `ctx.compact` / `ctx.mid` mirror the CSS layout breakpoints (portrait or ≤700px wide / <1100px wide); if you change one side, change the other. The hamburger nav switches separately at 860px, and short landscape viewports (≤560px tall) get their own compressed rules.
- Scene defs read **their own** chapter progress from `scroll.p.<chapter>` (not `ctx.p`), so a scene stays stable while a neighbouring chapter is active.
- Timelines (beat ranges, chapter lengths) live in `content/timeline.ts` and are imported by both the section and the scene — change them there only.
- One global light rig (hemisphere, key with shadows, fill, two point lamps) is reconfigured per scene through `Look`. Do not add lights inside scenes: constant light counts keep shader programs stable.
- Fog is applied after tone mapping, so backdrops/sky use `toneMapped: false` and the fog colour must equal the sky horizon colour.

### Bundle boundary

The 3D engine (three + R3F + every scene) is one lazy chunk loaded by `App.tsx` after first paint. Code in `sections/`, `ui/`, `state/`, `lib/` and `content/` must **not** import from `src/three/**` (the only exception is the three-free `three/core/director.ts`). Shared constants go in `lib/dimensions.ts` or a store. Check with `npm run build`: the `index-*.js` chunk must not contain three.js.

### Procedural geometry and real assets

All 3D is placeholder geometry built with `Builder` (boxes/cylinders merged into one mesh per material). To swap in a real model: drop the `.glb` in `/public/assets/<folder>/` and set its path in `src/config/assets.ts`. Objects wrapped in `<ModelSlot src={…}>` load it and fall back to the procedural version if the path is null or loading fails. Never hard-code asset paths in components.

`shell.ts` is the single definition of the capsule envelope; both `Capsule` (configurator/transport) and `HeroModule` (layered explainer) derive from it so every scene shows the same product.

### Configurator (`lib/grid.ts`, `state/config.ts`)

- 3 m grid, `GRID_W × GRID_D` cells, up to `MAX_LEVELS` (5, per catalogue) and `MAX_MODULES`.
- Placement only at connection points: edge-adjacent on the ground, or fully supported above. A module with something resting on it cannot be moved, rotated or removed.
- Every change is a "flight" (`flights` map, tweened by GSAP) rendered as a hoist lift in `ConfigScene`.
- `ui/ConfigPlan.tsx` draws the floor plan from the same `modules` array and exposes the same connection points as buttons — this is also the keyboard path and the no-WebGL path. Keep 3D and plan in sync by deriving both from the store; never give the plan its own state.
- `lib/shipping.ts` turns a configuration into truck loads and scroll-scrubbed lift poses for the journey chapter.

### Enquiries

No backend in V1. `lib/enquiry.ts` POSTs JSON to `VITE_ENQUIRY_ENDPOINT` if set; otherwise it opens a pre-filled `mailto:` to the sales address and the UI says exactly that. Do not show a "sent" state for something that was not sent.

## Design system

- Palette (CSS tokens in `styles/base.css`, 3D in `three/core/materials.ts`): navy `#0B1720` / `#101E27`, ivory `#F1EEE5`, concrete `#B8B7AE`, Wieldy lime `#A8C64A` (brand mark is `#A0CC39`) used only for small markers, optional brass `#B69A6A`. No orange/red legacy palette, no gradients-as-decoration, no glassmorphism, no glow borders.
- Type: Manrope 500 uppercase display with tight tracking; Instrument Sans body; IBM Plex Mono for labels (uppercase, wide tracking). Max three families.
- UI: thin rules, restrained bordered buttons, ivory "paper" sheets for drawings and the comparison ledger, strong negative space.
- 3D look: architectural maquette at dusk — matte materials, one soft key light, warm interiors, additive light pools on dark floors. Not a game: no bloom, no neon, no bouncy motion. Every animation must explain structure.

## Accessibility, fallback, performance

- Reduced motion (`prefers-reduced-motion` or `?reduced`): chapters step between `stops` and the stage fades between static views; configurator lifts are instant.
- No WebGL / context loss / stage error → `ui/Backdrop.tsx` isometric line drawings; all content and the plan-based configurator still work.
- Loader milestones are real (fonts, engine chunk, first scene compiled, first frame) — never a fake percentage.
- Quality tiers (`lib/device.ts`): low = no shadow maps, DPR ≤1.5; adaptive DPR drops when frames are slow. Scenes are code-split and mounted only near their chapter. Dispose geometry you create (`Built` does this unless `owned={false}`).
- Keyboard: all controls are real buttons/links with visible focus; plan connection points and modules are focusable.

## Documentation

`docs/SITE-WALKTHROUGH.md` describes every screen, 3D object and animation in visitor order (for the client and for onboarding). When a chapter's content, layout, timing or objects change, update the matching part of that file in the same change.

## Verification

After UI or 3D changes: `npm run typecheck` and `npm run build`, then check in a browser at 1440, 1920, 1366, tablet (1024×768, 834×1112), 390 and 430 px, plus a phone in landscape (844×390) — no horizontal overflow, no console errors, text not overlapping models. Exercise the configurator (add, place, move, rotate, stack, remove, reset, catalogue preset) and confirm the plan and the journey chapter follow. Check `?reduced` and `?nowebgl`.

## Status / changelog

- **2026-10-01 — V1 built.** Full 11-step narrative, single-canvas scroll director, procedural scenes (factory exterior + hall, sectional reveal, Why Wieldy, 9-stage construction story, capsule pair, catalogue layouts with drawn floor plans, configurator with synchronized plan, transport → site → installation of the visitor's configuration, interior walk, two future-product concepts), contact paths, catalogue-request dialog, footer credit, loader, reduced-motion and no-WebGL fallbacks.
- **V1 QA (2026-10-01):** verified with headless Chrome at 1440×900, 1920×1080, 1366×768, 1024×768, 834×1112, 390×844, 430×932 and 844×390 — no horizontal overflow, no console errors, 60 fps on integrated graphics; configurator add / place (3D click, touch tap, plan button) / rotate / stack / remove / reset / catalogue preset, plan sync, journey using the visitor's configuration, quote hand-off, both contact paths, catalogue dialog, mobile menu, `?reduced` and `?nowebgl` all exercised. The embedded preview pane throttles rendering when a viewport is emulated, so screenshots there can be stale — prefer a real browser window for visual checks.
- **2026-10-02:** added `docs/SITE-WALKTHROUGH.md` (screen-by-screen description of the site, its 3D objects and animations).
- **Open items:** real GLB/photo assets (all geometry is placeholder) · BOAIVE official URL for the footer credit · enquiry endpoint (currently mailto hand-off) · final CAD floor plans to replace the redrawn catalogue layouts · the meeting summary also lists a "real references / completed work" section, which the V1 brief explicitly excludes — confirm with the client before adding.
