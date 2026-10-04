import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubbleOutline, documentOutline, ellipsisHorizontal, heart, heartOutline, personCircleOutline, repeatOutline, sendOutline, shareOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';
import { Post, PostService } from '../../services/post.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink, IonIcon],
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;

  readonly accountService = inject(AccountService);
  private readonly postService = inject(PostService);
  commentOpen = false;
  commentDraft = '';
  actionMessage = '';

  constructor() {
    addIcons({ chatbubbleOutline, documentOutline, ellipsisHorizontal, heart, heartOutline, personCircleOutline, repeatOutline, sendOutline, shareOutline });
  }

  get authorImage() {
    return this.accountService.accounts().find((account) => account.id === this.post.authorId)?.profileImage;
  }

  get isLiked() {
    const accountId = this.accountService.selectedAccount()?.id;
    return accountId !== undefined && this.post.likes.includes(accountId);
  }

  get isReposted() {
    const accountId = this.accountService.selectedAccount()?.id;
    return accountId !== undefined && this.post.reposts.includes(accountId);
  }

  toggleLike() {
    const account = this.accountService.selectedAccount();
    if (!account) return this.requireAccount();
    this.actionMessage = '';
    this.postService.toggleLike(this.post.id, account.id);
  }

  toggleComments() {
    if (!this.accountService.selectedAccount()) return this.requireAccount();
    this.actionMessage = '';
    this.commentOpen = !this.commentOpen;
  }

  submitComment() {
    const account = this.accountService.selectedAccount();
    if (!account) return this.requireAccount();
    const body = this.commentDraft.trim();
    if (!body) return;
    this.postService.addComment(this.post.id, account, body);
    this.commentDraft = '';
    this.commentOpen = false;
    this.actionMessage = '';
  }

  toggleRepost() {
    const account = this.accountService.selectedAccount();
    if (!account) return this.requireAccount();
    this.actionMessage = '';
    this.postService.toggleRepost(this.post.id, account.id);
  }

  async sharePost() {
    this.actionMessage = '';
    const postUrl = new URL(window.location.href);
    postUrl.hash = `post-${this.post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${this.post.authorName} on Tali`, text: this.post.body, url: postUrl.toString() });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl.toString());
        this.actionMessage = 'Link copied.';
      } else {
        this.actionMessage = 'Sharing is not available in this browser.';
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.actionMessage = 'Could not share this post.';
      }
    }
  }

  private requireAccount() {
    this.actionMessage = 'Select an account to interact with posts.';
  }
}