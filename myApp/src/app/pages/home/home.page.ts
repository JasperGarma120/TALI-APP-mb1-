import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonAvatar, IonFooter } from '@ionic/angular';
import { AccountService } from '../../services/account.service';
import { PostService } from '../../services/post.service';
import { NotificationService } from '../../services/notification.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, documentOutline, ellipsisHorizontal, heartOutline, homeSharp, notificationsOutline, personCircleOutline, personOutline, repeatOutline, searchOutline, shareOutline } from 'ionicons/icons';
import { PostCardComponent } from '../../components/post-card/post-card.component';
import { ViewStateService } from '../../services/view-state.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonAvatar, IonFooter, CommonModule, FormsModule, RouterLink, PostCardComponent]
})
export class HomePage implements AfterViewInit {
  @ViewChild(IonContent) private content?: IonContent;
  private readonly route = inject(ActivatedRoute);
  readonly accountService = inject(AccountService);
  readonly postService = inject(PostService);
  readonly notificationService = inject(NotificationService);
  readonly viewState = inject(ViewStateService);
  private readonly viewStateKey = 'tali-view-home';

  get unreadNotifications() {
    const accountId = this.accountService.selectedAccount()?.id;
    return accountId === undefined ? 0 : this.notificationService.unreadCount(accountId);
  }

  get feedPosts() {
    const viewer = this.accountService.selectedAccount();
    const accounts = this.accountService.accounts();
    return this.postService.posts().filter((post) => !post.archivedAt && !post.trashedAt && this.postService.canViewPost(post, viewer, accounts));
  }

  get focusedPostId() {
    return this.route.snapshot.queryParamMap.get('postId');
  }

  get openCommentsForFocusedPost() {
    return this.route.snapshot.queryParamMap.get('openComments') === 'true';
  }

  get notificationFocusKey() {
    return this.route.snapshot.queryParamMap.get('notificationId') ?? '';
  }

  profileImageFor(authorId: number | null) {
    const author = this.accountService.accounts().find((account) => account.id === authorId);
    return author && this.accountService.canViewProfileImage(author, this.accountService.selectedAccount()) ? author.profileImage : undefined;
  }

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, documentOutline, ellipsisHorizontal, heartOutline, homeSharp, notificationsOutline, personCircleOutline, personOutline, repeatOutline, searchOutline, shareOutline });
  }

  ngAfterViewInit() {
    if (this.focusedPostId) return;
    const savedScrollTop = this.viewState.read<number>(this.viewStateKey, 0);
    if (savedScrollTop > 0) void this.content?.scrollToPoint(0, savedScrollTop, 0);
  }

  saveScroll(event: CustomEvent<{ scrollTop: number }>) {
    this.viewState.write(this.viewStateKey, event.detail.scrollTop);
  }
}
