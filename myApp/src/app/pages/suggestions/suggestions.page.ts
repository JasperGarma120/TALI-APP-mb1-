import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, atOutline, chatbubbleOutline, heartOutline, homeOutline, notificationsOutline, personAddOutline, personCircleOutline, repeatOutline, shareOutline, trendingUpOutline } from 'ionicons/icons';
import { Account, AccountService } from '../../services/account.service';
import { AppNotification, NotificationService } from '../../services/notification.service';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  templateUrl: './suggestions.page.html',
  styleUrls: ['./suggestions.page.scss'],
  imports: [CommonModule, RouterLink, IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonToolbar],
})
export class SuggestionsPage {
  readonly accountService = inject(AccountService);
  readonly postService = inject(PostService);
  readonly notificationService = inject(NotificationService);
  selectedSection: 'suggestions' | 'notifications' = 'suggestions';
  selectedCategory: 'people' | 'posts' | 'groups' = 'people';

  get people() {
    const selectedId = this.accountService.selectedAccount()?.id;
    return this.accountService.accounts().filter((account) => account.id !== selectedId);
  }

  get posts() {
    const viewer = this.accountService.selectedAccount();
    const accounts = this.accountService.accounts();
    return this.postService.posts().filter((post) =>
      post.authorId !== viewer?.id && this.postService.canViewPost(post, viewer, accounts),
    );
  }

  constructor() {
    addIcons({ addCircle, atOutline, chatbubbleOutline, heartOutline, homeOutline, notificationsOutline, personAddOutline, personCircleOutline, repeatOutline, shareOutline, trendingUpOutline });
  }

  get notifications() {
    const accountId = this.accountService.selectedAccount()?.id;
    return accountId === undefined ? [] : this.notificationService.forAccount(accountId);
  }

  get unreadNotifications() {
    const accountId = this.accountService.selectedAccount()?.id;
    return accountId === undefined ? 0 : this.notificationService.unreadCount(accountId);
  }

  notificationMessage(notification: AppNotification) {
    switch (notification.type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'followed you';
      case 'share': return 'shared your post';
      case 'repost': return 'reposted your post';
      case 'mention': return 'mentioned you';
    }
  }

  markNotificationRead(notification: AppNotification) {
    this.notificationService.markRead(notification.id, notification.recipientId);
  }

  markAllNotificationsRead() {
    const accountId = this.accountService.selectedAccount()?.id;
    if (accountId !== undefined) this.notificationService.markAllRead(accountId);
  }

  toggleFollow(person: Account) {
    if (this.isFollowing(person)) this.accountService.unfollowAccount(person.id);
    else this.accountService.followAccount(person.id);
  }

  isFollowing(person: Account) {
    return this.accountService.selectedAccount()?.followingIds.includes(person.id) ?? false;
  }
}
