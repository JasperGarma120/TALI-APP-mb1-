import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonAvatar, IonFooter } from '@ionic/angular';
import { AccountService } from '../../services/account.service';
import { PostService } from '../../services/post.service';
import { NotificationService } from '../../services/notification.service';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, documentOutline, ellipsisHorizontal, heartOutline, homeSharp, notificationsOutline, personCircleOutline, personOutline, repeatOutline, searchOutline, shareOutline } from 'ionicons/icons';
import { PostCardComponent } from '../../components/post-card/post-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonAvatar, IonFooter, CommonModule, FormsModule, RouterLink, PostCardComponent]
})
export class HomePage {
  readonly accountService = inject(AccountService);
  readonly postService = inject(PostService);
  readonly notificationService = inject(NotificationService);

  get unreadNotifications() {
    const accountId = this.accountService.selectedAccount()?.id;
    return accountId === undefined ? 0 : this.notificationService.unreadCount(accountId);
  }

  get feedPosts() {
    const viewer = this.accountService.selectedAccount();
    const accounts = this.accountService.accounts();
    return this.postService.posts().filter((post) => this.postService.canViewPost(post, viewer, accounts));
  }

  profileImageFor(authorId: number | null) {
    return this.accountService.accounts().find((account) => account.id === authorId)?.profileImage;
  }

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, documentOutline, ellipsisHorizontal, heartOutline, homeSharp, notificationsOutline, personCircleOutline, personOutline, repeatOutline, searchOutline, shareOutline });
  }
}
