import { Injectable, signal } from '@angular/core';
import type { Account } from './account.service';

export type PostAudience = 'public' | 'friends' | 'friends-of-friends' | 'selected-friends' | 'hide-from' | 'only-me';

export interface PostAttachment {
  name: string;
  type: string;
  dataUrl: string;
}

export interface Post {
  id: string;
  authorId: number | null;
  authorName: string;
  authorUsername: string;
  body: string;
  attachments: PostAttachment[];
  audience: PostAudience;
  audienceAccountIds: number[];
  createdAt: Date;
}

export type NewPost = Omit<Post, 'id' | 'createdAt'>;

@Injectable({ providedIn: 'root' })
export class PostService {
  readonly posts = signal<Post[]>([]);
  private nextId = 0;

  addPost(post: NewPost) {
    const publishedPost: Post = {
      ...post,
      id: `${Date.now()}-${++this.nextId}`,
      createdAt: new Date(),
    };

    this.posts.update((posts) => [publishedPost, ...posts]);
    return publishedPost;
  }

  canViewPost(post: Post, viewer: Account | null, accounts: Account[]) {
    if (viewer && post.authorId === viewer.id) return true;
    if (!viewer) return post.audience === 'public' || post.audience === 'hide-from';

    const author = accounts.find((account) => account.id === post.authorId);
    const areFriends = (first: Account, second: Account) =>
      first.followingIds.includes(second.id) && second.followingIds.includes(first.id);

    switch (post.audience) {
      case 'public':
        return true;
      case 'friends':
        return Boolean(author && areFriends(author, viewer));
      case 'friends-of-friends':
        return Boolean(author && accounts.some((friend) =>
          friend.id !== author.id && friend.id !== viewer.id &&
          areFriends(author, friend) && areFriends(friend, viewer),
        ));
      case 'selected-friends':
        return post.audienceAccountIds.includes(viewer.id);
      case 'hide-from':
        return !post.audienceAccountIds.includes(viewer.id);
      case 'only-me':
        return false;
    }
  }

  updateAuthor(accountId: number, authorName: string, authorUsername: string) {
    this.posts.update((posts) => posts.map((post) => post.authorId === accountId
      ? { ...post, authorName, authorUsername }
      : post));
  }
}