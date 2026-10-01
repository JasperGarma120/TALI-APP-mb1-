import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonAvatar, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonToolbar } from '@ionic/angular';
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
    IonItem,
    IonInput,
    IonButton,
    IonAvatar,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
  ],
})
export class CreateAccountPage {
  firstName = '';
  lastName = '';
  emailOrNumber = '';
  password = '';
  submitted = false;
  accountError = '';

  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  createAccount() {
    this.submitted = true;

    if (!this.firstName.trim() || !this.lastName.trim() || !this.emailOrNumber.trim() || !this.password.trim()) {
      return;
    }

    this.accountService.createAccount(this.firstName, this.lastName, this.emailOrNumber, this.password);
    this.router.navigateByUrl('/home');
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
