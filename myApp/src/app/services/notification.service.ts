import { Injectable, signal } from '@angular/core';
import type { Account } from './account.service';
import { loadBrowserData, saveBrowserData } from './browser-data.store';

export type NotificationType = 'like' | 'comment' | 'follow' | 'share' | 'repost' | 'mention' | 'message_request';

export interface AppNotification {
  id: string;
  recipientId: number;
  actorId: number;
  actorName: string;
  actorUsername: string;
  type: NotificationType;
  postId: string | null;
  conversationId?: string;
  postPreview: string;
  createdAt: Date;
  read: boolean;
}

const notificationsStorageKey = 'tali-notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);
  private changedBeforeHydration = false;
  private nextId = 0;

  constructor() {
    void loadBrowserData(notificationsStorageKey, [], isStoredNotificationList).then((saved) => {
      const merged = this.changedBeforeHydration
        ? mergeNotifications(saved, this.notifications())
        : saved;
      this.notifications.set(merged.map(restoreNotificationDate));
      if (this.changedBeforeHydration) this.persist();
    });
  }

  forAccount(accountId: number) {
    return this.notifications()
      .filter((notification) => notification.recipientId === accountId)
      .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
  }

  unreadCount(accountId: number) {
    return this.notifications().filter((notification) =>
      notification.recipientId === accountId && !notification.read,
    ).length;
  }

  notifyFollow(actor: Pick<Account, 'id' | 'name' | 'username'>, recipientId: number) {
    this.add('follow', actor, recipientId, null, '');
  }

  notifyMessageRequest(actor: Pick<Account, 'id' | 'name' | 'username'>, recipientId: number, conversationId: string, preview: string) {
    if (this.notifications().some((notification) => notification.type === 'message_request' && notification.conversationId === conversationId && notification.recipientId === recipientId)) return;
    this.add('message_request', actor, recipientId, null, preview.trim().slice(0, 120), conversationId);
  }

  notifyPostAction(
    type: Extract<NotificationType, 'like' | 'comment' | 'share' | 'repost'>,
    actor: Pick<Account, 'id' | 'name' | 'username'>,
    recipientId: number | null,
    postId: string,
    postPreview: string,
  ) {
    if (recipientId !== null) this.add(type, actor, recipientId, postId, postPreview);
  }

  notifyMentions(
    actor: Pick<Account, 'id' | 'name' | 'username'>,
    text: string,
    accounts: Account[],
    postId: string,
  ) {
    const mentionedUsernames = new Set(
      Array.from(text.matchAll(/@([a-z0-9._-]+)/gi), (match) => match[1].toLowerCase()),
    );
    for (const account of accounts) {
      const username = account.username.replace(/^@/, '').toLowerCase();
      if (account.id !== actor.id && mentionedUsernames.has(username)) {
        this.add('mention', actor, account.id, postId, text.trim().slice(0, 120));
      }
    }
  }

  markRead(notificationId: string, recipientId: number) {
    let changed = false;
    this.notifications.update((notifications) => notifications.map((notification) => {
      if (notification.id !== notificationId || notification.recipientId !== recipientId || notification.read) return notification;
      changed = true;
      return { ...notification, read: true };
    }));
    if (changed) this.persist();
  }

  markAllRead(recipientId: number) {
    let changed = false;
    this.notifications.update((notifications) => notifications.map((notification) => {
      if (notification.recipientId !== recipientId || notification.read) return notification;
      changed = true;
      return { ...notification, read: true };
    }));
    if (changed) this.persist();
  }

  private add(
    type: NotificationType,
    actor: Pick<Account, 'id' | 'name' | 'username'>,
    recipientId: number,
    postId: string | null,
    postPreview: string,
    conversationId?: string,
  ) {
    if (actor.id === recipientId) return;
    const notification: AppNotification = {
      id: `${Date.now()}-${++this.nextId}`,
      recipientId,
      actorId: actor.id,
      actorName: actor.name,
      actorUsername: actor.username,
      type,
      postId,
      ...(conversationId ? { conversationId } : {}),
      postPreview,
      createdAt: new Date(),
      read: false,
    };
    this.notifications.update((notifications) => [notification, ...notifications]);
    this.persist();
  }

  private persist() {
    this.changedBeforeHydration = true;
    void saveBrowserData(notificationsStorageKey, this.notifications());
    try {
      localStorage.setItem(notificationsStorageKey, JSON.stringify(this.notifications()));
    } catch {
      // IndexedDB above also stores notifications when localStorage is full.
    }
  }
}

function isStoredNotificationList(value: unknown): value is AppNotification[] {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const notification = item as Partial<AppNotification>;
    return typeof notification.id === 'string' && Number.isSafeInteger(notification.recipientId) &&
      Number.isSafeInteger(notification.actorId) && typeof notification.actorName === 'string' &&
      typeof notification.actorUsername === 'string' &&
      ['like', 'comment', 'follow', 'share', 'repost', 'mention', 'message_request'].includes(String(notification.type)) &&
      (typeof notification.postId === 'string' || notification.postId === null) &&
      (notification.conversationId === undefined || typeof notification.conversationId === 'string') &&
      typeof notification.postPreview === 'string' &&
      (typeof notification.createdAt === 'string' || notification.createdAt instanceof Date) &&
      typeof notification.read === 'boolean';
  });
}

function mergeNotifications(saved: AppNotification[], current: AppNotification[]) {
  const merged = new Map(saved.map((notification) => [notification.id, notification]));
  for (const notification of current) merged.set(notification.id, notification);
  return [...merged.values()].sort((first, second) =>
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

function restoreNotificationDate(notification: AppNotification): AppNotification {
  return { ...notification, createdAt: new Date(notification.createdAt) };
}
