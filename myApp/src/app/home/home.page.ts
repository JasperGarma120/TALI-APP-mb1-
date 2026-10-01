import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonAvatar, IonContent, IonFooter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personCircleOutline, homeSharp, searchOutline, addCircle, heartOutline, personOutline } from 'ionicons/icons';

interface Post {
  id: number;
  name: string;
  username: string;
  text: string;
  hasImage: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonAvatar, IonContent, IonFooter],
})
export class HomePage {
  posts: Post[] = [
    { id: 1, name: 'Jordan Cruz', username: '@jordan.cruz', text: 'First thread on Tali, connecting one idea at a time.', hasImage: true },
    { id: 2, name: 'Mika Santos', username: '@mika.santos', text: 'Loving how simple it is to start a conversation here.', hasImage: false },
    { id: 3, name: 'Dani Reyes', username: '@dani.reyes', text: 'Anyone else exploring the new features today?', hasImage: false },
  ];

  constructor() {
    addIcons({ personCircleOutline, homeSharp, searchOutline, addCircle, heartOutline, personOutline });
  }
}