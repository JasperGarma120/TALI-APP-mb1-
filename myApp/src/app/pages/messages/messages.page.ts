import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonSearchbar, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, checkmarkOutline, createOutline, filterOutline, homeOutline, paperPlaneOutline, personCircleOutline, trendingUpOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';
import { Conversation, MessageService } from '../../services/message.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  imports: [FormsModule, RouterLink, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonSearchbar, IonToolbar],
})
export class MessagesPage {
  private readonly accountService = inject(AccountService);
  private readonly messageService = inject(MessageService);
  readonly selectedAccount = this.accountService.selectedAccount;
  readonly accounts = this.accountService.accounts;
  readonly conversations = this.messageService.conversations;
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
  groupName = '';
  selectedMemberIds: number[] = [];
  messageDraft = '';
  readonly filters = ['All', 'Unread', 'Unanswered', 'Verified'];

  readonly visibleConversations = computed(() => {
    const accountId = this.selectedAccount()?.id;
    const query = this.searchQuery.trim().toLowerCase();
    return this.conversations()
      .filter((conversation) => accountId !== undefined && conversation.memberIds.includes(accountId))
      .filter((conversation) => this.conversationTitle(conversation).toLowerCase().includes(query))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  });

  get activeConversation() {
    return this.conversations().find((conversation) => conversation.id === this.activeConversationId) ?? null;
  }

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, checkmarkOutline, createOutline, filterOutline, homeOutline, paperPlaneOutline, personCircleOutline, trendingUpOutline });
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
    return otherAccount?.name ?? otherAccount?.username ?? 'Account unavailable';
  }

  conversationPreview(conversation: Conversation) {
    return conversation.messages.at(-1)?.body ?? 'Start a conversation';
  }

  openConversation(conversationId: string) {
    this.activeConversationId = conversationId;
  }

  closeConversation() {
    this.activeConversationId = null;
    this.messageDraft = '';
  }

  sendMessage() {
    const account = this.selectedAccount();
    const conversation = this.activeConversation;
    if (!account || !conversation || !this.messageDraft.trim()) return;
    this.messageService.sendMessage(conversation.id, account.id, this.messageDraft);
    this.messageDraft = '';
  }
}
