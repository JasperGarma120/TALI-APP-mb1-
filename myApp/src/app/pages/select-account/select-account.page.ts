import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonContent, IonList, IonItem, IonAvatar, IonLabel, IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personCircleOutline, chevronForwardOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-select-account',
  standalone: true,
  templateUrl: './select-account.page.html',
  styleUrls: ['./select-account.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonIcon,
  ],
})
export class SelectAccountPage {
  public accountService = inject(AccountService);
  private router = inject(Router);

  constructor() {
    addIcons({ personCircleOutline, chevronForwardOutline });
  }

  get previewAccounts() {
    return this.accountService.accounts().slice(0, 3);
  }

  chooseAccount(account: ReturnType<typeof this.accountService.accounts>[number]) {
    this.accountService.selectAccount(account);
    this.router.navigateByUrl('/login');
  }

  goToMoreAccounts() {
    this.router.navigateByUrl('/more-accounts');
  }
}