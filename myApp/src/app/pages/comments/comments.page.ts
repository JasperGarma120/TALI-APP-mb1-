import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon, IonTextarea, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline, closeOutline, imageOutline, personCircleOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';
import { Post, PostAttachment, PostService } from '../../services/post.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  templateUrl: './comments.page.html',
  styleUrls: ['./comments.page.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonContent, IonIcon, IonTextarea],
})
export class CommentsPage {
  @Input({ required: true }) postId!: string;

  private readonly accountService = inject(AccountService);
  private readonly postService = inject(PostService);
  private readonly modalController = inject(ModalController);

  commentDraft = '';
  commentError = '';
  selectedMediaIndex = 0;

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline, closeOutline, imageOutline, personCircleOutline });
  }

  get post(): Post | null {
    const post = this.postService.posts().find((item) => item.id === this.postId);
    if (!post) return null;
    return this.postService.canViewPost(post, this.accountService.selectedAccount(), this.accountService.accounts()) ? post : null;
  }

  get mediaAttachments(): PostAttachment[] {
    return this.post?.attachments.filter((attachment) => attachment.type.startsWith('image/') || attachment.type.startsWith('video/')) ?? [];
  }

  get selectedMedia(): PostAttachment | null {
    const media = this.mediaAttachments;
    if (!media.length) return null;
    this.selectedMediaIndex = Math.min(this.selectedMediaIndex, media.length - 1);
    return media[this.selectedMediaIndex];
  }

  get authorImage() {
    return this.accountService.accounts().find((account) => account.id === this.post?.authorId)?.profileImage;
  }

  commentAuthorImage(authorId: number) {
    return this.accountService.accounts().find((account) => account.id === authorId)?.profileImage;
  }

  moveMedia(direction: number) {
    const count = this.mediaAttachments.length;
    if (!count) return;
    this.selectedMediaIndex = (this.selectedMediaIndex + direction + count) % count;
  }

  close() {
    this.modalController.dismiss();
  }

  submitComment() {
    const account = this.accountService.selectedAccount();
    const post = this.post;
    const body = this.commentDraft.trim();
    if (!post || !body) return;
    if (!account) {
      this.commentError = 'Select an account to comment.';
      return;
    }

    this.postService.addComment(post.id, account, body, this.accountService.accounts());
    this.commentDraft = '';
    this.commentError = '';
  }
}
