import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonSearchbar, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import 'emoji-picker-element';
import { addCircle, addOutline, arrowUpOutline, chatbubbleOutline, checkmarkOutline, chevronBackOutline, closeOutline, createOutline, ellipsisHorizontal, filterOutline, happyOutline, homeOutline, imageOutline, micOutline, notificationsOutline, paperPlaneOutline, personCircleOutline, pinOutline, searchOutline, stopCircleOutline, videocamOutline } from 'ionicons/icons';
import { Account, AccountService } from '../../services/account.service';
import { ChatAttachment, ChatMessage, Conversation, MessageService, SharedItemsType } from '../../services/message.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  imports: [FormsModule, RouterLink, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonSearchbar, IonToolbar],
})
export class MessagesPage {
  private readonly accountService = inject(AccountService);
  readonly messageService = inject(MessageService);
  readonly notificationService = inject(NotificationService);
  readonly selectedAccount = this.accountService.selectedAccount;
  readonly accounts = this.accountService.accounts;
  readonly conversations = this.messageService.conversations;
  get unreadNotifications() {
    const accountId = this.selectedAccount()?.id;
    return accountId === undefined ? 0 : this.notificationService.unreadCount(accountId);
  }
  readonly otherAccounts = computed(() => {
    const selected = this.selectedAccount();
    return selected ? this.accounts().filter((account) => account.id !== selected.id) : [];
  });

  activeTab: 'inbox' | 'requests' = 'inbox';
  activeFilter = 'All';
  showFilters = false;
  composeMode: 'menu' | 'direct' | 'group' | null = null;
  activeConversationId: string | null = null;
  searchQuery = '';
  conversationSearch = '';
  showChatSettings = false;
  showSharedItems = false;
  sharedItemsType: SharedItemsType = 'photos';
  nicknameDraft = '';
  callNotice = '';
  settingsNotice = '';
  groupName = '';
  selectedMemberIds: number[] = [];
  messageDraft = '';
  pendingAttachments: ChatAttachment[] = [];
  recordingVoice = false;
  reactionPickerMessageId: string | null = null;
  private voiceRecorder: MediaRecorder | null = null;
  readonly filters = ['All', 'Unread', 'Unanswered', 'Verified', 'Archived'];

  get visibleConversations() {
    const accountId = this.selectedAccount()?.id;
    const query = this.searchQuery.trim().toLowerCase();
    return this.conversations()
      .filter((conversation) => accountId !== undefined && conversation.memberIds.includes(accountId))
      .filter((conversation) => {
        if (accountId === undefined) return false;
        const settings = this.messageService.settingsFor(conversation.id);
        const isRequest = this.isConversationRequest(conversation, accountId);
        if ((this.activeTab === 'requests') !== isRequest) return false;
        if (this.activeFilter === 'Archived') return settings.archivedFor.includes(accountId);
        if (settings.archivedFor.includes(accountId) || settings.restrictedFor.includes(accountId)) return false;
        if (this.activeFilter === 'Unread') return this.unreadMessageCount(conversation) > 0;
        if (this.activeFilter === 'Unanswered') {
          const latestMessage = conversation.messages.at(-1);
          return !!latestMessage && latestMessage.senderId !== accountId;
        }
        if (this.activeFilter === 'Verified') return this.conversationHasVerifiedParticipant(conversation, accountId);
        return true;
      })
      .filter((conversation) => this.conversationTitle(conversation).toLowerCase().includes(query) || conversation.messages.some((message) => message.body.toLowerCase().includes(query)))
      .sort((a, b) => Number(this.messageService.settingsFor(b.id).pinnedFor.includes(accountId ?? -1)) - Number(this.messageService.settingsFor(a.id).pinnedFor.includes(accountId ?? -1)) || b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  private isConversationRequest(conversation: Conversation, accountId: number) {
    if (conversation.groupName) return false;
    const otherId = conversation.memberIds.find((id) => id !== accountId);
    const otherAccount = this.accounts().find((account) => account.id === otherId);
    if (!otherId || otherAccount?.followingIds.includes(accountId)) return false;
    const acceptedFor = this.messageService.settingsFor(conversation.id).acceptedFor;
    if (acceptedFor.includes(accountId) || acceptedFor.includes(otherId)) return false;

    const firstMessage = conversation.messages[0];
    if (!firstMessage) return false;
    // Keep it pending until the recipient accepts or replies. If this account
    // started the chat, a reply from the other account accepts that request.
    return firstMessage.senderId === accountId
      ? !conversation.messages.slice(1).some((message) => message.senderId === otherId)
      : !conversation.messages.some((message) => message.senderId === accountId);
  }

  private conversationHasVerifiedParticipant(conversation: Conversation, accountId: number) {
    const participants = this.accounts().filter((account) => account.id !== accountId && conversation.memberIds.includes(account.id));
    return participants.length > 0 && participants.every((account) => account.verified === true);
  }

  acceptConversationRequest(conversationId: string) {
    const accountId = this.selectedAccount()?.id;
    if (accountId === undefined) return;
    const conversation = this.conversations().find((item) => item.id === conversationId);
    if (!conversation) return;
    const acceptedFor = this.messageService.settingsFor(conversationId).acceptedFor;
    if (!acceptedFor.includes(accountId)) {
      this.messageService.updateSettings(conversationId, { acceptedFor: [...acceptedFor, accountId] });
    }
  }

  get activeConversation() {
    return this.conversations().find((conversation) => conversation.id === this.activeConversationId) ?? null;
  }

  get activeChatAccount(): Account | null {
    const conversation = this.activeConversation;
    if (!conversation || conversation.groupName) return null;
    const otherId = conversation.memberIds.find((id) => id !== this.selectedAccount()?.id);
    return this.accounts().find((account) => account.id === otherId) ?? null;
  }

  get activeChatSettings() {
    return this.activeConversation ? this.messageService.settingsFor(this.activeConversation.id) : null;
  }

  get visibleMessages() {
    const messages = this.activeConversation?.messages ?? [];
    const query = this.conversationSearch.trim().toLowerCase();
    return query ? messages.filter((message) => message.body.toLowerCase().includes(query)) : messages;
  }

  constructor() {
    addIcons({ addCircle, addOutline, arrowUpOutline, chatbubbleOutline, checkmarkOutline, chevronBackOutline, closeOutline, createOutline, ellipsisHorizontal, filterOutline, happyOutline, homeOutline, imageOutline, micOutline, notificationsOutline, paperPlaneOutline, personCircleOutline, pinOutline, searchOutline, stopCircleOutline, videocamOutline });
  }

  openComposeMenu() {
    this.composeMode = 'menu';
  }

  closeCompose() {
    this.composeMode = null;
    this.selectedMemberIds = [];
    this.groupName = '';
  }

  startDirectMessage(accountId: number) {
    const account = this.selectedAccount();
    if (!account || account.id === accountId || !this.accounts().some((item) => item.id === accountId)) return;
    const conversation = this.messageService.openDirectConversation(account.id, accountId);
    this.closeCompose();
    this.activeConversationId = conversation.id;
  }

  toggleGroupMember(accountId: number) {
    this.selectedMemberIds = this.selectedMemberIds.includes(accountId)
      ? this.selectedMemberIds.filter((id) => id !== accountId)
      : [...this.selectedMemberIds, accountId];
  }

  createGroup() {
    const account = this.selectedAccount();
    const validMembers = this.selectedMemberIds.filter((id) => this.accounts().some((item) => item.id === id));
    if (!account || !this.groupName.trim() || validMembers.length === 0) return;
    const conversation = this.messageService.createGroupConversation([account.id, ...validMembers], this.groupName);
    this.closeCompose();
    this.activeConversationId = conversation.id;
  }

  conversationTitle(conversation: Conversation) {
    if (conversation.groupName) return conversation.groupName;
    const otherId = conversation.memberIds.find((id) => id !== this.selectedAccount()?.id);
    const otherAccount = this.accounts().find((account) => account.id === otherId);
    const nickname = this.messageService.settingsFor(conversation.id).nicknames[String(otherId)];
    return nickname?.trim() || otherAccount?.name || otherAccount?.username || 'Account unavailable';
  }

  messageAuthor(message: ChatMessage) {
    return this.accounts().find((account) => account.id === message.senderId);
  }

  messageAuthorName(message: ChatMessage) {
    return this.messageAuthor(message)?.name ?? 'Former account';
  }

  messageWasReadByOther(message: ChatMessage) {
    const accountId = this.selectedAccount()?.id;
    return accountId !== undefined && (message.readBy ?? []).some((readerId) => readerId !== accountId);
  }

  conversationIsUnread(conversation: Conversation) {
    return this.unreadMessageCount(conversation) > 0;
  }

  unreadMessageCount(conversation: Conversation) {
    const accountId = this.selectedAccount()?.id;
    if (accountId === undefined) return 0;
    const unreadCount = conversation.messages.filter((message) =>
      message.senderId !== accountId && !(message.readBy ?? []).includes(accountId),
    ).length;
    return Math.max(unreadCount, this.messageService.settingsFor(conversation.id).unreadFor.includes(accountId) ? 1 : 0);
  }

  conversationPreview(conversation: Conversation) {
    const latestMessage = conversation.messages.at(-1);
    if (!latestMessage) return 'Start a conversation';
    if (latestMessage.body) return latestMessage.body;
    const attachment = latestMessage.attachments?.[0];
    if (!attachment) return 'Message';
    return attachment.kind === 'voice' ? 'Voice message' : attachment.kind === 'gif' ? 'GIF' : attachment.kind === 'video' ? 'Video' : 'Photo';
  }

  openConversation(conversationId: string) {
    this.activeConversationId = conversationId;
    this.conversationSearch = '';
    this.reactionPickerMessageId = null;
    const accountId = this.selectedAccount()?.id;
    this.messageService.purgeExpiredMessages(conversationId);
    if (accountId !== undefined) this.messageService.markRead(conversationId, accountId);
  }

  closeConversation() {
    this.activeConversationId = null;
    this.messageDraft = '';
    this.showChatSettings = false;
    this.showSharedItems = false;
  }

  openChatSettings() {
    const conversation = this.activeConversation;
    if (!conversation) return;
    const otherId = conversation.memberIds.find((id) => id !== this.selectedAccount()?.id);
    this.nicknameDraft = this.messageService.settingsFor(conversation.id).nicknames[String(otherId)] ?? '';
    this.settingsNotice = '';
    this.showSharedItems = false;
    this.showChatSettings = true;
  }

  updateChatSetting(changes: Parameters<MessageService['updateSettings']>[1]) {
    const conversation = this.activeConversation;
    if (conversation) this.messageService.updateSettings(conversation.id, changes);
  }

  toggleChatPreference(preference: 'pinnedFor' | 'archivedFor' | 'unreadFor' | 'mutedFor' | 'restrictedFor' | 'blockedFor' | 'reportedFor') {
    const conversation = this.activeConversation;
    const accountId = this.selectedAccount()?.id;
    if (conversation && accountId !== undefined) this.messageService.toggleAccountPreference(conversation.id, preference, accountId);
  }

  reportConversation() {
    const conversation = this.activeConversation;
    const accountId = this.selectedAccount()?.id;
    if (!conversation || accountId === undefined) return;
    if (!this.messageService.settingsFor(conversation.id).reportedFor.includes(accountId)) {
      this.messageService.toggleAccountPreference(conversation.id, 'reportedFor', accountId);
    }
    this.settingsNotice = 'Report submitted for review.';
  }

  saveNickname() {
    const conversation = this.activeConversation;
    const otherId = conversation?.memberIds.find((id) => id !== this.selectedAccount()?.id);
    if (!conversation || otherId === undefined) return;
    const settings = this.messageService.settingsFor(conversation.id);
    const nicknames = { ...settings.nicknames };
    if (this.nicknameDraft.trim()) nicknames[String(otherId)] = this.nicknameDraft.trim();
    else delete nicknames[String(otherId)];
    this.updateChatSetting({ nicknames });
    this.settingsNotice = 'Nickname saved.';
  }

  sharedLinks() {
    const links: { messageId: string; url: string }[] = [];
    for (const message of this.activeConversation?.messages ?? []) {
      for (const match of message.body.matchAll(/https?:\/\/[^\s]+/gi)) links.push({ messageId: message.id, url: match[0] });
    }
    return links;
  }

  isPreferenceEnabled(preference: 'pinnedFor' | 'archivedFor' | 'unreadFor' | 'mutedFor' | 'restrictedFor' | 'blockedFor') {
    const accountId = this.selectedAccount()?.id;
    return accountId !== undefined && (this.activeChatSettings?.[preference].includes(accountId) ?? false);
  }

  chooseMessageReaction(message: ChatMessage, emoji: string) {
    const conversation = this.activeConversation;
    const accountId = this.selectedAccount()?.id;
    if (conversation && accountId !== undefined) this.messageService.toggleReaction(conversation.id, message.id, accountId, emoji);
    this.reactionPickerMessageId = null;
  }

  onEmojiSelected(event: Event, message: ChatMessage) {
    const emoji = (event as CustomEvent<{ unicode: string }>).detail?.unicode;
    if (emoji) this.chooseMessageReaction(message, emoji);
  }
  messageReactionList(message: ChatMessage) {
    return Object.entries(message.reactions ?? {})
      .filter(([, users]) => users.length > 0)
      .map(([emoji, users]) => ({ emoji, count: users.length }));
  }

  startVideoCall() {
    this.callNotice = 'Video calls are not connected in this local app yet.';
  }

  attachSelectedFile(event: Event, kind: 'photo' | 'video' | 'gif') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      this.callNotice = 'Choose a file smaller than 15 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.pendingAttachments = [...this.pendingAttachments, { kind, name: file.name, url: reader.result }];
        this.sendMessage();
      }
    };
    reader.onerror = () => this.callNotice = 'This file could not be loaded.';
    reader.readAsDataURL(file);
  }

  async toggleVoiceRecording() {
    if (this.recordingVoice && this.voiceRecorder) {
      this.voiceRecorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.callNotice = 'Voice recording is not supported by this browser.';
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      this.voiceRecorder = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        this.recordingVoice = false;
        this.voiceRecorder = null;
        const recording = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (recording.size > 15 * 1024 * 1024) {
          this.callNotice = 'The voice message is larger than 15 MB.';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            this.pendingAttachments = [...this.pendingAttachments, { kind: 'voice', name: 'Voice message', url: reader.result }];
            this.sendMessage();
          }
        };
        reader.readAsDataURL(recording);
      };
      recorder.start();
      this.recordingVoice = true;
      this.callNotice = 'Recording voice message. Tap the microphone again to send it.';
    } catch {
      this.callNotice = 'Microphone access was not granted.';
    }
  }

  sendMessage() {
    const account = this.selectedAccount();
    const conversation = this.activeConversation;
    if (!account || !conversation || (!this.messageDraft.trim() && !this.pendingAttachments.length) || this.isPreferenceEnabled('blockedFor')) return;
    this.messageService.sendMessage(conversation.id, account.id, this.messageDraft, this.pendingAttachments);
    this.messageDraft = '';
    this.pendingAttachments = [];
  }
}
