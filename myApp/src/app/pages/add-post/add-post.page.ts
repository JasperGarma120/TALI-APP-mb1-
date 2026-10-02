import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonTextarea, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, attachOutline, chatbubbleOutline, checkmarkOutline, closeCircleOutline, closeOutline, documentOutline, ellipsisVertical, homeOutline, micOutline, personCircleOutline, trendingUpOutline, videocamOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';
import { PostAttachment, PostAudience, PostService } from '../../services/post.service';

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
  showAudienceMenu = false;
  showAudiencePicker = false;
  audience: PostAudience = 'public';
  audienceAccountIds: number[] = [];
  readonly audienceOptions: { value: PostAudience; label: string }[] = [
    { value: 'public', label: 'Public' },
    { value: 'friends', label: 'Friends' },
    { value: 'friends-of-friends', label: 'Friends of Friends' },
    { value: 'selected-friends', label: 'Select Friends' },
    { value: 'hide-from', label: 'Hide From' },
    { value: 'only-me', label: 'Only Me' },
  ];

  constructor() {
    addIcons({ addCircle, attachOutline, chatbubbleOutline, checkmarkOutline, closeCircleOutline, closeOutline, documentOutline, ellipsisVertical, homeOutline, micOutline, personCircleOutline, trendingUpOutline, videocamOutline });
  }

  get canPublish() {
    const hasContent = this.message.trim() || this.pendingAttachments.length;
    const hasSelectedAudience = this.audience !== 'selected-friends' || this.audienceAccountIds.length > 0;
    return Boolean(this.accountService.selectedAccount() && hasContent && hasSelectedAudience);
  }

  get audienceAccounts() {
    const selectedId = this.accountService.selectedAccount()?.id;
    return this.accountService.accounts().filter((account) => account.id !== selectedId);
  }

  get audienceAccountPrompt() {
    return this.audience === 'hide-from' ? 'Choose who to hide this post from' : 'Choose friends who can see this post';
  }

  get selectedAudienceLabel() {
    return this.audienceOptions.find((option) => option.value === this.audience)?.label ?? 'Public';
  }

  selectAudience(audience: PostAudience) {
    if (this.audience !== audience) this.audienceAccountIds = [];
    this.audience = audience;
    this.showAudienceMenu = false;
    this.showAudiencePicker = audience === 'selected-friends' || audience === 'hide-from';
  }

  toggleAudienceAccount(accountId: number) {
    this.audienceAccountIds = this.audienceAccountIds.includes(accountId)
      ? this.audienceAccountIds.filter((id) => id !== accountId)
      : [...this.audienceAccountIds, accountId];
  }

  get mediaPermissionEnabled() {
    return typeof localStorage === 'undefined' || localStorage.getItem('tali-setting-mediaPermission') !== 'false';
  }

  async onFilesSelected(event: Event) {
    if (!this.mediaPermissionEnabled) return;
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
    if (!account) return;

    this.postService.addPost({
      authorId: account.id,
      authorName: account.name,
      authorUsername: account.username,
      body: this.message.trim(),
      attachments: [...this.pendingAttachments],
      audience: this.audience,
      audienceAccountIds: [...this.audienceAccountIds],
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