import { beforeEach, describe, expect, it } from 'vitest';
import { Account } from './account.service';
import { Post, PostAudience, PostService } from './post.service';

describe('PostService audience visibility', () => {
  let service: PostService;
  const author = makeAccount(1, [2, 3], [2, 3]);
  const friend = makeAccount(2, [1, 3], [1, 3]);
  const friendOfFriend = makeAccount(3, [1, 2], [1, 2]);
  const outsider = makeAccount(4);
  const accounts = [author, friend, friendOfFriend, outsider];

  beforeEach(() => {
    service = new PostService();
  });

  it('allows public posts for signed-out viewers', () => {
    expect(service.canViewPost(makePost('public'), null, accounts)).toBe(true);
  });

  it('limits friends posts to mutual follows', () => {
    expect(service.canViewPost(makePost('friends'), friend, accounts)).toBe(true);
    expect(service.canViewPost(makePost('friends'), outsider, accounts)).toBe(false);
  });

  it('allows friends of friends through a mutual connection', () => {
    expect(service.canViewPost(makePost('friends-of-friends'), friendOfFriend, accounts)).toBe(true);
    expect(service.canViewPost(makePost('friends-of-friends'), outsider, accounts)).toBe(false);
  });

  it('limits selected-friends posts to explicitly selected accounts', () => {
    expect(service.canViewPost(makePost('selected-friends', [friend.id]), friend, accounts)).toBe(true);
    expect(service.canViewPost(makePost('selected-friends', [friend.id]), outsider, accounts)).toBe(false);
  });

  it('hides posts from selected accounts while keeping the post public to others', () => {
    expect(service.canViewPost(makePost('hide-from', []), friend, accounts)).toBe(true);
    expect(service.canViewPost(makePost('hide-from', [friend.id]), friend, accounts)).toBe(false);
    expect(service.canViewPost(makePost('hide-from', [friend.id]), outsider, accounts)).toBe(true);
    expect(service.canViewPost(makePost('hide-from', [friend.id]), null, accounts)).toBe(true);
  });

  it('keeps only-me posts visible to their author', () => {
    expect(service.canViewPost(makePost('only-me'), author, accounts)).toBe(true);
    expect(service.canViewPost(makePost('only-me'), friend, accounts)).toBe(false);
  });
});

function makeAccount(id: number, followingIds: number[] = [], followersIds: number[] = []): Account {
  return {
    id,
    name: `Account ${id}`,
    username: `@account${id}`,
    contact: `account${id}@example.com`,
    password: 'test',
    bio: '',
    followingIds,
    followersIds,
  };
}

function makePost(audience: PostAudience, audienceAccountIds: number[] = []): Post {
  return {
    id: 'post-1',
    authorId: 1,
    authorName: 'Account 1',
    authorUsername: '@account1',
    body: 'Post body',
    attachments: [],
    audience,
    audienceAccountIds,
    createdAt: new Date(),
  };
}
