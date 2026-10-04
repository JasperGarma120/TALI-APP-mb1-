import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonTextarea, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, createOutline, homeOutline, imageOutline, personCircleOutline, repeatOutline, settingsOutline, trendingUpOutline, videocamOutline } from 'ionicons/icons';
import { PostCardComponent } from '../../components/post-card/post-card.component';
import { AccountService } from '../../services/account.service';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [CommonModule, FormsModule, RouterLink, IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonTextarea, IonToolbar, PostCardComponent],
})
export class ProfilePage {
  readonly accountService = inject(AccountService);
  readonly postService = inject(PostService);
  private readonly route = inject(ActivatedRoute);
  activeSection: 'posts' | 'photos' | 'videos' | 'reposts' = 'posts';
  editingProfile = false;
  editName = '';
  editUsername = '';
  editBio = '';
  editProfileImage = '';
  profileImageError = '';
  connectionsView: 'followers' | 'following' | null = null;

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, createOutline, homeOutline, imageOutline, personCircleOutline, repeatOutline, settingsOutline, trendingUpOutline, videocamOutline });
  }

  get profileAccount() {
    const accountId = this.route.snapshot.paramMap.get('accountId');
    if (accountId === null) return this.accountService.selectedAccount();
    return this.accountService.accounts().find((account) => account.id === Number(accountId)) ?? null;
  }

  get isOwnProfile() {
    const profileId = this.profileAccount?.id;
    return profileId !== undefined && profileId === this.accountService.selectedAccount()?.id;
  }

  get ownPosts() {
    const profile = this.profileAccount;
    const viewer = this.accountService.selectedAccount();
    const accounts = this.accountService.accounts();
    return profile
      ? this.postService.posts().filter((post) => post.authorId === profile.id && this.postService.canViewPost(post, viewer, accounts))
      : [];
  }

  get profilePhotos() {
    const profile = this.profileAccount;
    if (!profile) return [];
    return [
      ...(profile.profileImage ? [{ source: profile.profileImage, name: `${profile.name}'s profile photo` }] : []),
      ...this.ownPosts.flatMap((post) => post.attachments
        .filter((attachment) => attachment.type.startsWith('image/'))
        .map((attachment) => ({ source: attachment.dataUrl, name: attachment.name }))),
    ];
  }

  get profileVideos() {
    return this.ownPosts.flatMap((post) => post.attachments
      .filter((attachment) => attachment.type.startsWith('video/'))
      .map((attachment) => ({ source: attachment.dataUrl, type: attachment.type, name: attachment.name })));
  }

  get repostedPosts() {
    const profile = this.profileAccount;
    if (!profile) return [];
    const viewer = this.accountService.selectedAccount();
    const accounts = this.accountService.accounts();
    return this.postService.posts().filter((post) =>
      post.reposts.includes(profile.id) && this.postService.canViewPost(post, viewer, accounts),
    );
  }

  get followers() {
    const accountId = this.profileAccount?.id;
    return accountId === undefined ? [] : this.accountService.getFollowers(accountId);
  }

  get following() {
    const accountId = this.profileAccount?.id;
    return accountId === undefined ? [] : this.accountService.getFollowing(accountId);
  }

  get isFollowingProfile() {
    const profileId = this.profileAccount?.id;
    return profileId !== undefined && (this.accountService.selectedAccount()?.followingIds.includes(profileId) ?? false);
  }

  toggleFollowProfile() {
    const profileId = this.profileAccount?.id;
    if (profileId === undefined || this.isOwnProfile) return;
    if (this.isFollowingProfile) this.accountService.unfollowAccount(profileId);
    else this.accountService.followAccount(profileId);
  }

  openProfileEditor() {
    const account = this.isOwnProfile ? this.profileAccount : null;
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
    if (!this.isOwnProfile) return;
    const account = this.accountService.updateProfile(this.editName, this.editUsername, this.editBio, this.editProfileImage || undefined);
    if (account) this.postService.updateAuthor(account.id, account.name, account.username);
    this.editingProfile = false;
  }
}