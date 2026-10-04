# Asset drop folders

V1 ships with procedural placeholder geometry. Real Wieldy assets go here and are wired in through **one file**: `src/config/assets.ts`.

| Folder | What belongs here | Asset-map key |
| --- | --- | --- |
| `brand/` | Logo mark, wordmark | `brandAssets` |
| `factory/` | Facility exterior / production hall models | `factoryAssets.exterior`, `.interior` |
| `modules/` | Base capsule (3m × 3m) and extended capsule (6m × 3m) models | `moduleAssets.base`, `.extended` |
| `construction/` | One model per construction stage (foundation → habitat) | `constructionAssets.*` |
| `floorplans/` | Final CAD floor-plan exports | drawn from `src/content/plans.ts` today |
| `interiors/` | Finished interior model | `interiorAssets.habitat` |
| `future/` | Labour Precamp and Capsule House concept models | `futureAssets.*` |
| `textures/` | Shared textures | — |

## Swapping a model

1. Export `.glb` (metres, +Y up, origin at the centre of the footprint with the base at y = 0; capsule glazed front facing +Z).
2. Drop it in the matching folder.
3. Set its path in `src/config/assets.ts`, e.g. `moduleAssets.extended = '/assets/modules/extended-capsule.glb'`.

The matching object is wrapped in `<ModelSlot>`, which loads the file and falls back to the procedural placeholder if the path is `null` or the file fails to load — a missing asset never breaks the page.

Keep models light: Draco/meshopt-compressed geometry, KTX2 or ≤2K textures, one material per surface type where possible.
