import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  id: string;
  senderId: number;
  body: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  memberIds: number[];
  groupName: string | null;
  messages: ChatMessage[];
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  readonly conversations = signal<Conversation[]>([]);
  private nextId = 0;

  openDirectConversation(accountId: number, otherAccountId: number) {
    const memberIds = [accountId, otherAccountId].sort((a, b) => a - b);
    const existing = this.conversations().find((conversation) =>
      !conversation.groupName && conversation.memberIds.length === 2 &&
      conversation.memberIds[0] === memberIds[0] && conversation.memberIds[1] === memberIds[1],
    );
    return existing ?? this.createConversation(memberIds, null);
  }

  createGroupConversation(accountIds: number[], groupName: string) {
    return this.createConversation([...new Set(accountIds)], groupName.trim());
  }

  sendMessage(conversationId: string, senderId: number, body: string) {
    const text = body.trim();
    if (!text) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${++this.nextId}`,
      senderId,
      body: text,
      createdAt: new Date(),
    };
    this.conversations.update((conversations) => conversations.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, messages: [...conversation.messages, message], updatedAt: message.createdAt }
        : conversation,
    ));
  }

  private createConversation(memberIds: number[], groupName: string | null) {
    const conversation: Conversation = {
      id: `${Date.now()}-${++this.nextId}`,
      memberIds,
      groupName,
      messages: [],
      updatedAt: new Date(),
    };
    this.conversations.update((conversations) => [conversation, ...conversations]);
    return conversation;
  }
}
