import { lazy } from 'react';
import type { SceneEntry } from '../core/Stage';
import type { SceneId } from '../core/types';
import { configDef } from './config.def';
import { factoryDef } from './factory.def';
import { futureDef } from './future.def';
import { habitatDef } from './habitat.def';
import { moduleDef } from './module.def';
import { routeDef } from './route.def';
import { storyDef } from './story.def';
import { systemDef } from './system.def';

/**
 * Scene registry. Definitions (camera + light) are tiny and load with the
 * engine; scene geometry is code-split and only fetched as its chapter nears.
 */
export const SCENES: Record<SceneId, SceneEntry> = {
  factory: { def: factoryDef, Component: lazy(() => import('./FactoryScene')) },
  module: { def: moduleDef, Component: lazy(() => import('./ModuleScene')) },
  story: { def: storyDef, Component: lazy(() => import('./StoryScene')) },
  system: { def: systemDef, Component: lazy(() => import('./SystemScene')) },
  config: { def: configDef, Component: lazy(() => import('./ConfigScene')) },
  route: { def: routeDef, Component: lazy(() => import('./RouteScene')) },
  habitat: { def: habitatDef, Component: lazy(() => import('./HabitatScene')) },
  future: { def: futureDef, Component: lazy(() => import('./FutureScene')) },
};
