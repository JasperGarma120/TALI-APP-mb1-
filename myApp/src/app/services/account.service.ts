import { Injectable, signal } from '@angular/core';

export interface Account {
  id: number;
  name: string;
  username: string;
  contact: string;
  password: string;
  bio: string;
  profileImage?: string;
  followersIds: number[];
  followingIds: number[];
}

const accountsStorageKey = 'tali-accounts';
const activeAccountStorageKey = 'tali-active-account';

@Injectable({ providedIn: 'root' })
export class AccountService {
  accounts = signal<Account[]>([]);

  selectedAccount = signal<Account | null>(null);

  constructor() {
    const accounts = this.loadAccounts();
    const activeAccountId = this.loadActiveAccountId();
    this.accounts.set(accounts);
    this.selectedAccount.set(accounts.find((account) => account.id === activeAccountId) ?? null);
  }

  selectAccount(account: Account) {
    this.selectedAccount.set(account);
    this.persistActiveAccount();
  }

  createAccount(firstName: string, lastName: string, username: string, contact: string, password: string) {
    const normalizedContact = contact.trim().toLowerCase();
    const normalizedUsername = `@${username.trim().replace(/^@+/, '').toLowerCase()}`;
    if (this.accounts().some((account) =>
      account.contact.toLowerCase() === normalizedContact || account.username.toLowerCase() === normalizedUsername,
    )) return null;

    const account: Account = {
      id: Date.now(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      username: normalizedUsername,
      contact: normalizedContact,
      password,
      bio: '',
      followersIds: [],
      followingIds: [],
    };

    this.accounts.update((accounts) => [...accounts, account]);
    this.selectedAccount.set(account);
    this.persistAccounts();
    this.persistActiveAccount();
    return account;
  }

  updateProfile(name: string, username: string, bio: string, profileImage?: string) {
    const selected = this.selectedAccount();
    if (!selected) return null;

    const updated: Account = {
      ...selected,
      name: name.trim(),
      username: username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`,
      bio: bio.trim(),
      profileImage,
    };
    this.accounts.update((accounts) => accounts.map((account) => account.id === selected.id ? updated : account));
    this.selectedAccount.set(updated);
    this.persistAccounts();
    this.persistActiveAccount();
    return updated;
  }

  logout() {
    this.selectedAccount.set(null);
    this.persistActiveAccount();
  }

  changePassword(currentPassword: string, newPassword: string) {
    const selected = this.selectedAccount();
    if (!selected || selected.password !== currentPassword || !newPassword.trim()) return false;
    const updated = { ...selected, password: newPassword };
    this.accounts.update((accounts) => accounts.map((account) => account.id === selected.id ? updated : account));
    this.selectedAccount.set(updated);
    this.persistAccounts();
    this.persistActiveAccount();
    return true;
  }

  followAccount(targetId: number) {
    const selected = this.selectedAccount();
    if (!selected || selected.id === targetId || selected.followingIds.includes(targetId)) return;

    const accounts = this.accounts();
    const target = accounts.find((account) => account.id === targetId);
    if (!target) return;

    const updatedSelected = { ...selected, followingIds: [...selected.followingIds, targetId] };
    const updatedTarget = { ...target, followersIds: [...target.followersIds, selected.id] };
    this.accounts.set(accounts.map((account) =>
      account.id === selected.id ? updatedSelected : account.id === targetId ? updatedTarget : account,
    ));
    this.selectedAccount.set(updatedSelected);
    this.persistAccounts();
    this.persistActiveAccount();
  }

  unfollowAccount(targetId: number) {
    const selected = this.selectedAccount();
    if (!selected || !selected.followingIds.includes(targetId)) return;

    const accounts = this.accounts();
    const target = accounts.find((account) => account.id === targetId);
    const updatedSelected = { ...selected, followingIds: selected.followingIds.filter((id) => id !== targetId) };
    this.accounts.set(accounts.map((account) => {
      if (account.id === selected.id) return updatedSelected;
      if (account.id === targetId && target) {
        return { ...target, followersIds: target.followersIds.filter((id) => id !== selected.id) };
      }
      return account;
    }));
    this.selectedAccount.set(updatedSelected);
    this.persistAccounts();
    this.persistActiveAccount();
  }

  getFollowers(accountId: number) {
    return this.accounts().filter((account) => account.followingIds.includes(accountId));
  }

  getFollowing(accountId: number) {
    const account = this.accounts().find((item) => item.id === accountId);
    return this.accounts().filter((item) => account?.followingIds.includes(item.id));
  }

  authenticate(identifier: string, password: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    return this.accounts().find(
      (account) =>
        account.contact.toLowerCase() === normalizedIdentifier &&
        account.password === password,
    ) ?? null;
  }

  private loadAccounts(): Account[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const stored = JSON.parse(localStorage.getItem(accountsStorageKey) ?? '[]') as unknown;
      return Array.isArray(stored) ? stored.filter(isStoredAccount) : [];
    } catch {
      return [];
    }
  }

  private loadActiveAccountId(): number | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(activeAccountStorageKey);
      if (stored === null) return null;
      const accountId = Number(stored);
      return Number.isSafeInteger(accountId) ? accountId : null;
    } catch {
      return null;
    }
  }

  private persistAccounts() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(accountsStorageKey, JSON.stringify(this.accounts()));
    } catch {
      return;
    }
  }

  private persistActiveAccount() {
    if (typeof localStorage === 'undefined') return;
    try {
      const account = this.selectedAccount();
      if (account) localStorage.setItem(activeAccountStorageKey, String(account.id));
      else localStorage.removeItem(activeAccountStorageKey);
    } catch {
      return;
    }
  }
}

function isStoredAccount(value: unknown): value is Account {
  if (typeof value !== 'object' || value === null) return false;
  const account = value as Partial<Account>;
  return Number.isSafeInteger(account.id) &&
    typeof account.name === 'string' &&
    typeof account.username === 'string' &&
    typeof account.contact === 'string' &&
    typeof account.password === 'string' &&
    typeof account.bio === 'string' &&
    (account.profileImage === undefined || typeof account.profileImage === 'string') &&
    Array.isArray(account.followersIds) && account.followersIds.every(Number.isSafeInteger) &&
    Array.isArray(account.followingIds) && account.followingIds.every(Number.isSafeInteger);
}