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

const postsStorageKey = 'tali-posts';

@Injectable({ providedIn: 'root' })
export class PostService {
  readonly posts = signal<Post[]>([]);
  private nextId = 0;
  private nextCommentId = 0;

  constructor() {
    this.posts.set(this.loadPosts());
  }

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
  this.persistPosts();
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
    this.persistPosts();
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
    this.persistPosts();
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
    this.persistPosts();
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
    this.persistPosts();
  }

  private loadPosts(): Post[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const stored = JSON.parse(localStorage.getItem(postsStorageKey) ?? '[]') as unknown;
      if (!Array.isArray(stored)) return [];
      return stored.filter(isStoredPost).map((post) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        comments: post.comments.map((comment) => ({ ...comment, createdAt: new Date(comment.createdAt) })),
      }));
    } catch {
      return [];
    }
  }

  private persistPosts() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(postsStorageKey, JSON.stringify(this.posts()));
    } catch {
      return;
    }
  }
}

function isStoredPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) return false;
  const post = value as Partial<Post>;
  return typeof post.id === 'string' &&
    (typeof post.authorId === 'number' || post.authorId === null) &&
    typeof post.authorName === 'string' &&
    typeof post.authorUsername === 'string' &&
    typeof post.body === 'string' &&
    Array.isArray(post.attachments) &&
    Array.isArray(post.audienceAccountIds) &&
    Array.isArray(post.likes) &&
    Array.isArray(post.comments) &&
    Array.isArray(post.reposts) &&
    (typeof post.createdAt === 'string' || post.createdAt instanceof Date);
}