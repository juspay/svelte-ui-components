import { writable } from 'svelte/store';

/**
 * Shared across every mounted HITL. When the user interacts with one
 * card, all sibling cards stop their countdowns so an auto-approval never fires
 * while the user is actively deciding.
 */
export const pauseAllConfirmationTimers = writable(false);
