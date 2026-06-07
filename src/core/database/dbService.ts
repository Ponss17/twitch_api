/**
 * dbService.ts
 *
 * Este archivo ahora actúa como una Fachada (Facade) que re-exporta
 * todas las funcionalidades de la base de datos que han sido separadas
 * en sus propios servicios. Esto mantiene la compatibilidad con otras
 * partes del sistema que importan directamente de `dbService.ts`.
 */

export * from './cryptoService';
export * from './auditService';
export * from './activityService';
export * from './statsService';
export * from './userService';
// Admin removed
export { supabase } from './supabaseClient';
