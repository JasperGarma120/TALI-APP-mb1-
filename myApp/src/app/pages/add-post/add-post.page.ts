import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonTextarea, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, attachOutline, chatbubbleOutline, closeCircleOutline, documentOutline, homeOutline, personCircleOutline, trendingUpOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';
import { PostAttachment, PostService } from '../../services/post.service';

@Component({
  selector: 'app-add-post',
  standalone: true,
  templateUrl: './add-post.page.html',
  styleUrls: ['./add-post.page.scss'],
  imports: [FormsModule, RouterLink, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonTextarea, IonToolbar],
})
export class AddPostPage {
  readonly accountService = inject(AccountService);
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);
  message = '';
  pendingAttachments: PostAttachment[] = [];
  mediaError = '';

  constructor() {
    addIcons({ addCircle, attachOutline, chatbubbleOutline, closeCircleOutline, documentOutline, homeOutline, personCircleOutline, trendingUpOutline });
  }

  get canPublish() {
    return Boolean(this.message.trim() || this.pendingAttachments.length);
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.mediaError = '';

    const results = await Promise.all(files.map((file) => this.readFile(file).catch(() => null)));
    const attachments = results.filter((result): result is PostAttachment => result !== null);
    this.pendingAttachments = [...this.pendingAttachments, ...attachments];
    if (attachments.length !== files.length) this.mediaError = 'Some files could not be added. Please try again.';
  }

  removeAttachment(index: number) {
    this.pendingAttachments = this.pendingAttachments.filter((_, attachmentIndex) => attachmentIndex !== index);
  }

  publish() {
    if (!this.canPublish) return;
    const account = this.accountService.selectedAccount();

    this.postService.addPost({
      authorId: account?.id ?? null,
      authorName: account?.name ?? 'Community member',
      authorUsername: account?.username ?? '@community',
      body: this.message.trim(),
      attachments: [...this.pendingAttachments],
    });
    void this.router.navigateByUrl('/home');
  }

  private readFile(file: File): Promise<PostAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        dataUrl: String(reader.result),
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}