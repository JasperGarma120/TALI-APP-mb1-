import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonAvatar, IonFooter } from '@ionic/angular';
import { AccountService } from '../../services/account.service';
import { PostService } from '../../services/post.service';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, documentOutline, ellipsisHorizontal, heartOutline, homeSharp, personCircleOutline, personOutline, repeatOutline, searchOutline, shareOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonAvatar, IonFooter, CommonModule, FormsModule, RouterLink]
})
export class HomePage {
  readonly accountService = inject(AccountService);
  readonly postService = inject(PostService);

  get feedPosts() {
    const viewer = this.accountService.selectedAccount();
    const accounts = this.accountService.accounts();
    return this.postService.posts().filter((post) => this.postService.canViewPost(post, viewer, accounts));
  }

  profileImageFor(authorId: number | null) {
    return this.accountService.accounts().find((account) => account.id === authorId)?.profileImage;
  }

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, documentOutline, ellipsisHorizontal, heartOutline, homeSharp, personCircleOutline, personOutline, repeatOutline, searchOutline, shareOutline });
  }
}
