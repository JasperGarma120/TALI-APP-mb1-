import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonContent, IonList, IonItem, IonAvatar, IonLabel, IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';
import { AccountService, Account } from '../../services/account.service';

@Component({
  selector: 'app-more-accounts',
  standalone: true,
  templateUrl: './more-accounts.page.html',
  styleUrls: ['./more-accounts.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonIcon],
})
export class MoreAccountsPage {
  public accountService = inject(AccountService);
  private router = inject(Router);

  constructor() {
    addIcons({ personCircleOutline });
  }

  chooseAccount(account: Account) {
    this.accountService.selectAccount(account);
    this.router.navigateByUrl('/login');
  }
}