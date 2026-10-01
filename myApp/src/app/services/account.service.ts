import { Injectable, signal } from '@angular/core';

export interface Account {
  id: number;
  name: string;
  username: string;
  contact: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  accounts = signal<Account[]>([]);

  selectedAccount = signal<Account | null>(null);

  selectAccount(account: Account) {
    this.selectedAccount.set(account);
  }

  createAccount(firstName: string, lastName: string, contact: string, password: string) {
    const normalizedContact = contact.trim().toLowerCase();
    const account: Account = {
      id: Date.now(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      username: `@${firstName.trim().toLowerCase()}${lastName.trim().toLowerCase()}`,
      contact: normalizedContact,
      password,
    };

    this.accounts.update((accounts) => [...accounts, account]);
    this.selectedAccount.set(account);
    return account;
  }

  authenticate(identifier: string, password: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    return this.accounts().find(
      (account) =>
        (account.contact.toLowerCase() === normalizedIdentifier ||
          account.username.toLowerCase() === normalizedIdentifier) &&
        account.password === password,
    ) ?? null;
  }
}