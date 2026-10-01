import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonSearchbar, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, checkmarkOutline, createOutline, filterOutline, homeOutline, paperPlaneOutline, personCircleOutline, trendingUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-messages',
  standalone: true,
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  imports: [RouterLink, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonSearchbar, IonToolbar],
})
export class MessagesPage {
  activeTab: 'inbox' | 'requests' = 'inbox';
  activeFilter = 'All';
  showFilters = false;
  readonly filters = ['All', 'Unread', 'Unanswered', 'Verified'];

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, checkmarkOutline, createOutline, filterOutline, homeOutline, paperPlaneOutline, personCircleOutline, trendingUpOutline });
  }
}