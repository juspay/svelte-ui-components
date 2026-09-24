/**
 * The single place that maps a public `OrbState` name to the mode function
 * that draws it. `ThinkingOrb.svelte` only ever imports `MODES`, never a mode
 * file directly, so adding a state is a one-line change here plus a new
 * export in whichever mode file it belongs to.
 */

import type { OrbState } from '../../properties';
import type { ModeFn } from '../types';
import { listening, searching, solving, working } from './sphere';
import { connecting, weaving } from './network';
import { breathing, composing, shaping } from './form';

export const MODES: Record<OrbState, ModeFn> = {
  working,
  searching,
  solving,
  listening,
  connecting,
  weaving,
  composing,
  breathing,
  shaping
};
