// Índice dos emblemas do brasão. Cada emblema desenha em torno de (0,0);
// `spec` define o fundo: { backdrop: 'circle' | 'wide' | 'none', r, w, h, half }.
import { EMBLEMS_A } from './emblems-a.mjs';
import { EMBLEMS_B } from './emblems-b.mjs';
import { EMBLEMS_C } from './emblems-c.mjs';
import { EMBLEMS_D } from './emblems-d.mjs';

export const EMBLEMS = { ...EMBLEMS_A, ...EMBLEMS_B, ...EMBLEMS_C, ...EMBLEMS_D };
