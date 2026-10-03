import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonToolbar } from '@ionic/angular';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-create-account',
  standalone: true,
  templateUrl: './create-account.page.html',
  styleUrls: ['./create-account.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
  ],
})
export class CreateAccountPage {
  firstName = '';
  lastName = '';
  username = '';
  emailOrNumber = '';
  password = '';
  submitted = false;
  accountError = '';
  created = false;

  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  createAccount() {
    this.submitted = true;

    if (!this.firstName.trim() || !this.lastName.trim() || !this.username.trim() || !this.emailOrNumber.trim() || !this.password.trim()) {
      return;
    }

    const username = this.username.trim().replace(/^@+/, '');
    if (!username) {
      this.accountError = 'Enter a username.';
      return;
    }

    const contact = this.emailOrNumber.trim();
    if (!this.isValidContact(contact)) {
      this.accountError = 'Enter a valid email address or phone number.';
      return;
    }

    const account = this.accountService.createAccount(this.firstName, this.lastName, username, contact, this.password);
    if (!account) {
      this.accountError = 'That username or email/number is already in use.';
      return;
    }
    this.created = true;
  }

  private isValidContact(contact: string) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return true;
    const digits = contact.replace(/\D/g, '');
    return /^\+?[\d\s().-]+$/.test(contact) && digits.length >= 7 && digits.length <= 15;
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
