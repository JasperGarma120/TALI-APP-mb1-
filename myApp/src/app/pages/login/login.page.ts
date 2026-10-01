import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonItem, IonInput, IonButton, IonAvatar } from '@ionic/angular';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonItem, IonInput, IonButton, IonAvatar],
})
export class LoginPage implements OnInit {
  username = '';
  password = '';
  submitted = false;

  private readonly router = inject(Router);
  readonly accountService = inject(AccountService);

  ngOnInit() {
    const account = this.accountService.selectedAccount();
    if (account) {
      this.username = account.username;
    }
  }

  logIn() {
    this.submitted = true;

    if (!this.username.trim() || !this.password.trim()) {
      return;
    }

    const account = this.accountService.authenticate(this.username, this.password);
    if (!account) {
      return;
    }

    this.accountService.selectAccount(account);

    this.router.navigateByUrl('/home');
  }

  goToSelectAccount() {
    this.router.navigateByUrl('/select-account');
  }

  goToCreateAccount() {
    this.router.navigateByUrl('/create-account');
  }
}