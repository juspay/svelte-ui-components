import type { ChatParty, ChatRole } from './types';

export function partyOf(role: ChatRole): ChatParty {
  return role === 'sender' || role === 'user' ? 'sender' : 'responder';
}
