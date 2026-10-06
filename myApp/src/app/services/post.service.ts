import { Injectable, inject, signal } from '@angular/core';
import type { Account } from './account.service';
import { loadBrowserData, saveBrowserData } from './browser-data.store';
import { NotificationService } from './notification.service';

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
  private readonly notificationService = optionalNotificationService();
  readonly posts = signal<Post[]>([]);
  private nextId = 0;
  private nextCommentId = 0;
  private changedBeforeHydration = false;

  constructor() {
    const posts = this.loadPosts();
    this.posts.set(posts);
    void loadBrowserData(postsStorageKey, posts, isStoredPostList).then((savedPosts) => {
      const mergedPosts = this.changedBeforeHydration
        ? mergePosts(savedPosts, this.posts())
        : savedPosts;
      this.posts.set(mergedPosts.map(restorePostDates));
      if (this.changedBeforeHydration) this.persistPosts();
    });
  }

  addPost(post: NewPost, actor?: Pick<Account, 'id' | 'name' | 'username'>, accounts: Account[] = []) {
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
    if (actor) this.notificationService?.notifyMentions(actor, publishedPost.body, accounts, publishedPost.id);
    return publishedPost;
  }

  toggleLike(postId: string, actorOrId: number | Pick<Account, 'id' | 'name' | 'username'>) {
    const actor = typeof actorOrId === 'number' ? null : actorOrId;
    const accountId = typeof actorOrId === 'number' ? actorOrId : actorOrId.id;
    const post = this.posts().find((item) => item.id === postId);
    const alreadyLiked = post?.likes.includes(accountId) ?? false;
    this.posts.update((posts) => posts.map((post) => {
      if (post.id !== postId) return post;
      const likes = post.likes.includes(accountId)
        ? post.likes.filter((id) => id !== accountId)
        : [...post.likes, accountId];
      return { ...post, likes };
    }));
    this.persistPosts();
    if (post && actor && !alreadyLiked) {
      this.notificationService?.notifyPostAction('like', actor, post.authorId, post.id, post.body);
    }
  }

  addComment(
    postId: string,
    account: Pick<Account, 'id' | 'name' | 'username'>,
    body: string,
    accounts: Account[] = [],
  ) {
    const post = this.posts().find((item) => item.id === postId);
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
    if (post) {
      this.notificationService?.notifyPostAction('comment', account, post.authorId, post.id, body);
      this.notificationService?.notifyMentions(account, body, accounts, post.id);
    }
    return comment;
  }

  toggleRepost(postId: string, actorOrId: number | Pick<Account, 'id' | 'name' | 'username'>) {
    const actor = typeof actorOrId === 'number' ? null : actorOrId;
    const accountId = typeof actorOrId === 'number' ? actorOrId : actorOrId.id;
    const post = this.posts().find((item) => item.id === postId);
    const alreadyReposted = post?.reposts.includes(accountId) ?? false;
    this.posts.update((posts) => posts.map((post) => {
      if (post.id !== postId) return post;
      const reposts = post.reposts.includes(accountId)
        ? post.reposts.filter((id) => id !== accountId)
        : [...post.reposts, accountId];
      return { ...post, reposts };
    }));
    this.persistPosts();
    if (post && actor && !alreadyReposted) {
      this.notificationService?.notifyPostAction('repost', actor, post.authorId, post.id, post.body);
    }
  }

  recordShare(postId: string, actor: Pick<Account, 'id' | 'name' | 'username'>) {
    const post = this.posts().find((item) => item.id === postId);
    if (post) this.notificationService?.notifyPostAction('share', actor, post.authorId, post.id, post.body);
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
      })).map(restorePostDates);
    } catch {
      return [];
    }
  }

  private persistPosts() {
    this.changedBeforeHydration = true;
    void saveBrowserData(postsStorageKey, this.posts());
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(postsStorageKey, JSON.stringify(this.posts()));
    } catch {
      return;
    }
  }
}

function optionalNotificationService(): NotificationService | null {
  try {
    return inject(NotificationService);
  } catch {
    // Keep direct construction working in unit tests and non-Angular utilities.
    return null;
  }
}

function isStoredPostList(value: unknown): value is Post[] {
  return Array.isArray(value) && value.every(isStoredPost);
}

function mergePosts(savedPosts: Post[], currentPosts: Post[]): Post[] {
  const merged = new Map(savedPosts.map((post) => [post.id, post]));
  for (const post of currentPosts) merged.set(post.id, post);
  return [...merged.values()].sort((first, second) =>
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

function restorePostDates(post: Post): Post {
  return {
    ...post,
    createdAt: new Date(post.createdAt),
    comments: post.comments.map((comment) => ({ ...comment, createdAt: new Date(comment.createdAt) })),
  };
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
