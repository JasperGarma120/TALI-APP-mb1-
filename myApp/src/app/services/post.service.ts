import { Injectable, signal } from '@angular/core';

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

  updateAuthor(accountId: number, authorName: string, authorUsername: string) {
    this.posts.update((posts) => posts.map((post) => post.authorId === accountId
      ? { ...post, authorName, authorUsername }
      : post));
  }
}