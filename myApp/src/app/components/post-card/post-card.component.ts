import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon, IonModal } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubbleOutline, chevronBackOutline, chevronForwardOutline, documentOutline, ellipsisHorizontal, heart, heartOutline, personCircleOutline, repeatOutline, shareOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';
import { Post, PostService } from '../../services/post.service';
import { CommentsPage } from '../../pages/comments/comments.page';

@Component({
  selector: 'app-post-card',
  standalone: true,
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  imports: [CommonModule, RouterLink, IonIcon, IonModal, CommentsPage],
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;

  readonly accountService = inject(AccountService);
  private readonly postService = inject(PostService);
  commentsOpen = false;
  actionMessage = '';

  constructor() {
    addIcons({ chatbubbleOutline, chevronBackOutline, chevronForwardOutline, documentOutline, ellipsisHorizontal, heart, heartOutline, personCircleOutline, repeatOutline, shareOutline });
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

  scrollAttachments(event: WheelEvent) {
    const row = event.currentTarget as HTMLElement;
    if (row.scrollWidth <= row.clientWidth) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const nextScrollLeft = row.scrollLeft + delta;
    if (nextScrollLeft >= 0 && nextScrollLeft <= row.scrollWidth - row.clientWidth) {
      event.preventDefault();
      row.scrollLeft = nextScrollLeft;
    }
  }

  scrollAttachmentBy(event: MouseEvent, direction: -1 | 1) {
    const carousel = (event.currentTarget as HTMLElement).parentElement;
    const row = carousel?.querySelector<HTMLElement>('.post-attachments');
    const firstItem = row?.querySelector<HTMLElement>('.post-media, .post-file');
    if (!row || !firstItem) return;

    const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: 'smooth' });
  }

  get hasMultipleImages() {
    return this.post.attachments.filter((attachment) => attachment.type.startsWith('image/')).length > 1;
  }

  get hasVisualAttachments() {
    return this.post.attachments.some((attachment) => attachment.type.startsWith('image/') || attachment.type.startsWith('video/'));
  }

  openComments() {
    this.commentsOpen = true;
  }

  closeComments() {
    this.commentsOpen = false;
  }

  toggleLike() {
    const account = this.accountService.selectedAccount();
    if (!account) return this.requireAccount();
    this.actionMessage = '';
    this.postService.toggleLike(this.post.id, account);
  }

  toggleRepost() {
    const account = this.accountService.selectedAccount();
    if (!account) return this.requireAccount();
    this.actionMessage = '';
    this.postService.toggleRepost(this.post.id, account);
  }

  async sharePost() {
    this.actionMessage = '';
    const postUrl = new URL(window.location.href);
    postUrl.hash = `post-${this.post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${this.post.authorName} on Tali`, text: this.post.body, url: postUrl.toString() });
        const account = this.accountService.selectedAccount();
        if (account) this.postService.recordShare(this.post.id, account);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl.toString());
        this.actionMessage = 'Link copied.';
        const account = this.accountService.selectedAccount();
        if (account) this.postService.recordShare(this.post.id, account);
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
