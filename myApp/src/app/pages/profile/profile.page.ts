import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonTextarea, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, createOutline, homeOutline, personCircleOutline, settingsOutline, trendingUpOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [CommonModule, FormsModule, RouterLink, IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonTextarea, IonToolbar],
})
export class ProfilePage {
  readonly accountService = inject(AccountService);
  readonly postService = inject(PostService);
  editingProfile = false;
  editName = '';
  editUsername = '';
  editBio = '';
  editProfileImage = '';
  profileImageError = '';
  connectionsView: 'followers' | 'following' | null = null;

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, createOutline, homeOutline, personCircleOutline, settingsOutline, trendingUpOutline });
  }

  get ownPosts() {
    const accountId = this.accountService.selectedAccount()?.id;
    return this.postService.posts().filter((post) => post.authorId === accountId);
  }

  get followers() {
    const accountId = this.accountService.selectedAccount()?.id;
    return accountId === undefined ? [] : this.accountService.getFollowers(accountId);
  }

  get following() {
    const accountId = this.accountService.selectedAccount()?.id;
    return accountId === undefined ? [] : this.accountService.getFollowing(accountId);
  }

  openProfileEditor() {
    const account = this.accountService.selectedAccount();
    if (!account) return;
    this.editName = account.name;
    this.editUsername = account.username;
    this.editBio = account.bio;
    this.editProfileImage = account.profileImage ?? '';
    this.profileImageError = '';
    this.editingProfile = true;
  }

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.profileImageError = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.profileImageError = 'Choose an image file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.profileImageError = 'Choose an image smaller than 5 MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.editProfileImage = String(reader.result ?? '');
    reader.onerror = () => this.profileImageError = 'The image could not be read. Please try again.';
    reader.readAsDataURL(file);
  }

  removeProfileImage() {
    this.editProfileImage = '';
    this.profileImageError = '';
  }

  saveProfile() {
    if (!this.editName.trim() || !this.editUsername.trim()) return;
    const account = this.accountService.updateProfile(this.editName, this.editUsername, this.editBio, this.editProfileImage || undefined);
    if (account) this.postService.updateAuthor(account.id, account.name, account.username);
    this.editingProfile = false;
  }
}