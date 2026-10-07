import { Injectable, signal } from '@angular/core';
import { loadBrowserData, saveBrowserData } from './browser-data.store';

const conversationsStorageKey = 'tali-conversations';

export interface ChatMessage {
  id: string;
  senderId: number;
  body: string;
  createdAt: Date;
  reactions?: Record<string, number[]>;
  readBy?: number[];
  seenBy?: number[];
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  kind: 'photo' | 'video' | 'gif' | 'voice';
  name: string;
  url: string;
}

export type SharedItemsType = 'photos' | 'links' | 'files' | 'voice messages';

export interface ChatSettings {
  theme: 'default' | 'warm' | 'sage';
  wallpaper: 'plain' | 'glow' | 'grid';
  nicknames: Record<string, string>;
  reactionEmoji: string;
  disappearingAfterSeconds: number | null;
  readReceipts: boolean;
  typingIndicator: boolean;
  pinnedFor: number[];
  acceptedFor: number[];
  archivedFor: number[];
  unreadFor: number[];
  mutedFor: number[];
  restrictedFor: number[];
  blockedFor: number[];
  reportedFor: number[];
}

export interface Conversation {
  id: string;
  memberIds: number[];
  groupName: string | null;
  messages: ChatMessage[];
  updatedAt: Date;
  settings?: ChatSettings;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  readonly conversations = signal<Conversation[]>([]);
  private readonly typingByConversation = signal<Map<string, number[]>>(new Map());
  private nextId = 0;
  private changedBeforeHydration = false;

  constructor() {
    void loadBrowserData(conversationsStorageKey, [], isStoredConversationList).then((saved) => {
      const conversations = this.changedBeforeHydration
        ? mergeConversations(saved, this.conversations())
        : saved;
      this.conversations.set(conversations.map(restoreConversationDates));
      if (this.changedBeforeHydration) this.persistConversations();
    });
  }

  openDirectConversation(accountId: number, otherAccountId: number) {
    const memberIds = [accountId, otherAccountId].sort((a, b) => a - b);
    const existing = this.conversations().find((conversation) =>
      !conversation.groupName && conversation.memberIds.length === 2 &&
      conversation.memberIds[0] === memberIds[0] && conversation.memberIds[1] === memberIds[1],
    );
    return existing ?? this.createConversation(memberIds, null);
  }

  createGroupConversation(accountIds: number[], groupName: string) {
    const members = [...new Set(accountIds)];
    if (members.length < 5 || !groupName.trim()) return null;
    return this.createConversation(members, groupName.trim());
  }

  setTyping(conversationId: string, accountId: number, typing: boolean) {
    this.typingByConversation.update((current) => {
      const next = new Map(current);
      const users = new Set(next.get(conversationId) ?? []);
      if (typing) users.add(accountId); else users.delete(accountId);
      if (users.size) next.set(conversationId, [...users]); else next.delete(conversationId);
      return next;
    });
  }

  typingAccounts(conversationId: string) {
    return this.typingByConversation().get(conversationId) ?? [];
  }

  sendMessage(conversationId: string, senderId: number, body: string, attachments: ChatAttachment[] = []) {
    const text = body.trim();
    if (!text && !attachments.length) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${++this.nextId}`,
      senderId,
      body: text,
      attachments,
      createdAt: new Date(),
      readBy: [senderId],
      seenBy: [senderId],
    };
    this.conversations.update((conversations) => conversations.map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      const settings = normalizeChatSettings(conversation.settings);
      const unreadFor = new Set(settings.unreadFor.filter((id) => id !== senderId));
      for (const memberId of conversation.memberIds) if (memberId !== senderId) unreadFor.add(memberId);
      const messages = [...conversation.messages, message].filter((item) =>
        settings.disappearingAfterSeconds === null ||
        Date.now() - new Date(item.createdAt).getTime() <= settings.disappearingAfterSeconds * 1000,
      );
      return { ...conversation, settings: { ...settings, unreadFor: [...unreadFor] }, messages, updatedAt: message.createdAt };
    }));
    this.persistConversations();
  }

  settingsFor(conversationId: string) {
    return normalizeChatSettings(this.conversations().find((item) => item.id === conversationId)?.settings);
  }

  markRead(conversationId: string, accountId: number) {
    let changed = false;
    this.conversations.update((conversations) => conversations.map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      const settings = normalizeChatSettings(conversation.settings);
      const unreadFor = settings.unreadFor.filter((id) => id !== accountId);
      const messages = conversation.messages.map((message) => {
        if (message.senderId === accountId) return message;
        const readBy = message.readBy ?? [];
        const seenBy = message.seenBy ?? [];
        const needsRead = !readBy.includes(accountId);
        const needsReceipt = settings.readReceipts && !seenBy.includes(accountId);
        if (!needsRead && !needsReceipt) return message;
        changed = true;
        return {
          ...message,
          readBy: needsRead ? [...readBy, accountId] : readBy,
          seenBy: needsReceipt ? [...seenBy, accountId] : seenBy,
        };
      });
      if (unreadFor.length !== settings.unreadFor.length) changed = true;
      return { ...conversation, settings: { ...settings, unreadFor }, messages };
    }));
    if (changed) this.persistConversations();
  }

  purgeExpiredMessages(conversationId: string) {
    const conversation = this.conversations().find((item) => item.id === conversationId);
    if (!conversation) return;
    const expiry = normalizeChatSettings(conversation.settings).disappearingAfterSeconds;
    if (expiry === null) return;
    const messages = conversation.messages.filter((message) => Date.now() - new Date(message.createdAt).getTime() <= expiry * 1000);
    if (messages.length !== conversation.messages.length) {
      this.conversations.update((items) => items.map((item) => item.id === conversationId ? { ...item, messages } : item));
      this.persistConversations();
    }
  }

  updateSettings(conversationId: string, changes: Partial<ChatSettings>) {
    this.conversations.update((conversations) => conversations.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, settings: { ...normalizeChatSettings(conversation.settings), ...changes } }
        : conversation,
    ));
    this.persistConversations();
  }

  deleteConversation(conversationId: string) {
    this.conversations.update((items) => items.filter((item) => item.id !== conversationId));
    this.persistConversations();
  }

  toggleAccountPreference(
    conversationId: string,
    preference: 'pinnedFor' | 'archivedFor' | 'unreadFor' | 'mutedFor' | 'restrictedFor' | 'blockedFor' | 'reportedFor',
    accountId: number,
  ) {
    const conversation = this.conversations().find((item) => item.id === conversationId);
    if (!conversation) return;
    const values = normalizeChatSettings(conversation.settings)[preference];
    this.updateSettings(conversationId, {
      [preference]: values.includes(accountId)
        ? values.filter((id) => id !== accountId)
        : [...values, accountId],
    });
  }

  toggleReaction(conversationId: string, messageId: string, accountId: number, emoji: string) {
    this.conversations.update((conversations) => conversations.map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      return {
        ...conversation,
        messages: conversation.messages.map((message) => {
          if (message.id !== messageId) return message;
          const reactions = Object.fromEntries(Object.entries(message.reactions ?? {}).map(([key, users]) => [
            key, users.filter((id) => id !== accountId),
          ])) as Record<string, number[]>;
          const hadThisReaction = (message.reactions?.[emoji] ?? []).includes(accountId);
          if (!hadThisReaction) reactions[emoji] = [...(reactions[emoji] ?? []), accountId];
          if (!reactions[emoji].length) delete reactions[emoji];
          return { ...message, reactions };
        }),
      };
    }));
    this.persistConversations();
  }

  private createConversation(memberIds: number[], groupName: string | null) {
    const conversation: Conversation = {
      id: `${Date.now()}-${++this.nextId}`,
      memberIds,
      groupName,
      messages: [],
      updatedAt: new Date(),
      settings: normalizeChatSettings(),
    };
    this.conversations.update((conversations) => [conversation, ...conversations]);
    this.persistConversations();
    return conversation;
  }

  private persistConversations() {
    this.changedBeforeHydration = true;
    void saveBrowserData(conversationsStorageKey, this.conversations());
    try {
      localStorage.setItem(conversationsStorageKey, JSON.stringify(this.conversations()));
    } catch {
      // IndexedDB above holds the durable copy and supports larger app data.
    }
  }
}

function isStoredConversationList(value: unknown): value is Conversation[] {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const conversation = item as Partial<Conversation>;
    return typeof conversation.id === 'string' &&
      Array.isArray(conversation.memberIds) &&
      (typeof conversation.groupName === 'string' || conversation.groupName === null) &&
      Array.isArray(conversation.messages) &&
      (typeof conversation.updatedAt === 'string' || conversation.updatedAt instanceof Date) &&
      conversation.messages.every((message) =>
        typeof message.id === 'string' && Number.isSafeInteger(message.senderId) &&
        typeof message.body === 'string' &&
        (typeof message.createdAt === 'string' || message.createdAt instanceof Date),
      );
  });
}

function mergeConversations(saved: Conversation[], current: Conversation[]): Conversation[] {
  const merged = new Map(saved.map((conversation) => [conversation.id, conversation]));
  for (const conversation of current) merged.set(conversation.id, conversation);
  return [...merged.values()].sort((first, second) =>
    new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  );
}

function restoreConversationDates(conversation: Conversation): Conversation {
  const settings = normalizeChatSettings(conversation.settings);
  const expiry = settings.disappearingAfterSeconds;
  return {
    ...conversation,
    updatedAt: new Date(conversation.updatedAt),
    settings,
    messages: conversation.messages
      .filter((message) => expiry === null || Date.now() - new Date(message.createdAt).getTime() <= expiry * 1000)
      .map((message) => ({ ...message, createdAt: new Date(message.createdAt), reactions: normalizeReactions(message.reactions ?? {}), readBy: message.readBy ?? [] })),
  };
}

function normalizeReactions(reactions: Record<string, number[]>) {
  const seen = new Set<number>();
  return Object.fromEntries(Object.entries(reactions).map(([emoji, accountIds]) => {
    const unique = accountIds.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return [emoji, unique];
  }).filter(([, accountIds]) => accountIds.length));
}

export function normalizeChatSettings(settings?: Partial<ChatSettings>): ChatSettings {
  return {
    theme: settings?.theme === 'warm' || settings?.theme === 'sage' ? settings.theme : 'default',
    wallpaper: settings?.wallpaper === 'glow' || settings?.wallpaper === 'grid' ? settings.wallpaper : 'plain',
    nicknames: settings?.nicknames ?? {},
    reactionEmoji: settings?.reactionEmoji ?? '❤️',
    disappearingAfterSeconds: settings?.disappearingAfterSeconds ?? null,
    readReceipts: settings?.readReceipts ?? true,
    typingIndicator: settings?.typingIndicator ?? true,
    pinnedFor: settings?.pinnedFor ?? [],
    acceptedFor: settings?.acceptedFor ?? [],
    archivedFor: settings?.archivedFor ?? [],
    unreadFor: settings?.unreadFor ?? [],
    mutedFor: settings?.mutedFor ?? [],
    restrictedFor: settings?.restrictedFor ?? [],
    blockedFor: settings?.blockedFor ?? [],
    reportedFor: settings?.reportedFor ?? [],
  };
}
