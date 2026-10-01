import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, createOutline, homeOutline, personCircleOutline, settingsOutline, trendingUpOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [RouterLink, IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonToolbar],
})
export class ProfilePage {
  readonly accountService = inject(AccountService);

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, createOutline, homeOutline, personCircleOutline, settingsOutline, trendingUpOutline });
  }
}