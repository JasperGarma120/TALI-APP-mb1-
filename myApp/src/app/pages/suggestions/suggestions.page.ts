import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, homeOutline, personAddOutline, personCircleOutline, trendingUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  templateUrl: './suggestions.page.html',
  styleUrls: ['./suggestions.page.scss'],
  imports: [RouterLink, IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonToolbar],
})
export class SuggestionsPage {
  readonly people = [
    { name: 'Nina Reyes', username: '@nina.reyes', note: 'Interested in thoughtful conversations', following: false },
    { name: 'Eli Navarro', username: '@eli.navarro', note: 'Followed by Jordan Cruz', following: false },
    { name: 'Tess Flores', username: '@tess.flores', note: 'Writes about creativity and care', following: false },
  ];

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, homeOutline, personAddOutline, personCircleOutline, trendingUpOutline });
  }

  toggleFollow(person: (typeof this.people)[number]) {
    person.following = !person.following;
  }
}