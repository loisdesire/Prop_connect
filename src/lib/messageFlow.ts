export type ConversationRouteState = {
  openConversationWith?: string;
  openConversationWithName?: string;
  propertyTitle?: string;
  draftMessage?: string;
};

export const normalizeConversationId = (value: string | number | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

export const buildConversationRouteState = (
  agentId: string | number,
  agentName?: string | null,
  propertyTitle?: string,
  draftMessage?: string,
): ConversationRouteState => ({
  openConversationWith: String(agentId),
  openConversationWithName: normalizeConversationId(agentName || undefined) || undefined,
  propertyTitle: normalizeConversationId(propertyTitle || undefined) || undefined,
  draftMessage: normalizeConversationId(draftMessage || undefined) || undefined,
});

export const resolveConversationDisplayName = (
  currentUserId: string,
  firstMessage: { sender_id?: string; sender_name?: string; receiver_name?: string } | undefined,
  fallbackName?: string | null,
): string => {
  const fromMessage = firstMessage
    ? (firstMessage.sender_id === currentUserId ? firstMessage.receiver_name : firstMessage.sender_name)
    : null;

  return normalizeConversationId(fromMessage || fallbackName || undefined) || 'Agent';
};