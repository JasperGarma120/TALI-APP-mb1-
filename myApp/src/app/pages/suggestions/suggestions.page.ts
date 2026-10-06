import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, atOutline, chatbubbleOutline, heartOutline, homeOutline, notificationsOutline, personAddOutline, personCircleOutline, repeatOutline, shareOutline, trendingUpOutline } from 'ionicons/icons';
import { Account, AccountService } from '../../services/account.service';
import { AppNotification, NotificationService } from '../../services/notification.service';
import { PostService } from '../../services/post.service';
import { ViewStateService } from '../../services/view-state.service';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  templateUrl: './suggestions.page.html',
  styleUrls: ['./suggestions.page.scss'],
  imports: [CommonModule, RouterLink, IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonToolbar],
})
export class SuggestionsPage {
  readonly viewState = inject(ViewStateService);
  private readonly viewStateKey = 'tali-view-activity';
  readonly accountService = inject(AccountService);
  readonly postService = inject(PostService);
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
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
    const saved = this.viewState.read<Partial<{ selectedSection: 'suggestions' | 'notifications'; selectedCategory: 'people' | 'posts' | 'groups' }>>(this.viewStateKey, {});
    if (saved.selectedSection) this.selectedSection = saved.selectedSection;
    if (saved.selectedCategory) this.selectedCategory = saved.selectedCategory;
  }

  setSection(section: 'suggestions' | 'notifications') {
    this.selectedSection = section;
    this.saveViewState();
  }

  setCategory(category: 'people' | 'posts' | 'groups') {
    this.selectedCategory = category;
    this.saveViewState();
  }

  private saveViewState() {
    this.viewState.write(this.viewStateKey, { selectedSection: this.selectedSection, selectedCategory: this.selectedCategory });
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
    if (notification.type === 'follow') {
      void this.router.navigate(['/profile', notification.actorId]);
      return;
    }

    const post = notification.postId
      ? this.postService.posts().find((item) => item.id === notification.postId)
      : undefined;
    void this.router.navigate(['/home'], {
      queryParams: {
        postId: post?.id ?? notification.postId,
        openComments: ['like', 'comment', 'repost'].includes(notification.type) ? 'true' : null,
        notificationId: notification.id,
      },
    });
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
