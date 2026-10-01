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

@Injectable({ providedIn: 'root' })
export class AccountService {
  accounts = signal<Account[]>([]);

  selectedAccount = signal<Account | null>(null);

  selectAccount(account: Account) {
    this.selectedAccount.set(account);
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
    return updated;
  }

  logout() {
    this.selectedAccount.set(null);
  }

  changePassword(currentPassword: string, newPassword: string) {
    const selected = this.selectedAccount();
    if (!selected || selected.password !== currentPassword || !newPassword.trim()) return false;
    const updated = { ...selected, password: newPassword };
    this.accounts.update((accounts) => accounts.map((account) => account.id === selected.id ? updated : account));
    this.selectedAccount.set(updated);
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
}