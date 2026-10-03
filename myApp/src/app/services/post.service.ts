import { Injectable, signal } from '@angular/core';
import type { Account } from './account.service';

export type PostAudience = 'public' | 'friends' | 'friends-of-friends' | 'selected-friends' | 'hide-from' | 'only-me';

export interface PostAttachment {
  name: string;
  type: string;
  dataUrl: string;
}

export interface PostComment {
  id: string;
  authorId: number;
  authorName: string;
  authorUsername: string;
  body: string;
  createdAt: Date;
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
  likes: number[];
  comments: PostComment[];
  reposts: number[];
  createdAt: Date;
}

export type NewPost = Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'reposts'>;

@Injectable({ providedIn: 'root' })
export class PostService {
  readonly posts = signal<Post[]>([]);
  private nextId = 0;
  private nextCommentId = 0;

  addPost(post: NewPost) {
    const publishedPost: Post = {
      ...post,
      id: `${Date.now()}-${++this.nextId}`,
      likes: [],
      comments: [],
      reposts: [],
      createdAt: new Date(),
    };

    this.posts.update((posts) => [publishedPost, ...posts]);
    return publishedPost;
  }

  toggleLike(postId: string, accountId: number) {
    this.posts.update((posts) => posts.map((post) => {
      if (post.id !== postId) return post;
      const likes = post.likes.includes(accountId)
        ? post.likes.filter((id) => id !== accountId)
        : [...post.likes, accountId];
      return { ...post, likes };
    }));
  }

  addComment(postId: string, account: Pick<Account, 'id' | 'name' | 'username'>, body: string) {
    const comment: PostComment = {
      id: `${Date.now()}-${++this.nextCommentId}`,
      authorId: account.id,
      authorName: account.name,
      authorUsername: account.username,
      body: body.trim(),
      createdAt: new Date(),
    };
    this.posts.update((posts) => posts.map((post) =>
      post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
    ));
    return comment;
  }

  toggleRepost(postId: string, accountId: number) {
    this.posts.update((posts) => posts.map((post) => {
      if (post.id !== postId) return post;
      const reposts = post.reposts.includes(accountId)
        ? post.reposts.filter((id) => id !== accountId)
        : [...post.reposts, accountId];
      return { ...post, reposts };
    }));
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