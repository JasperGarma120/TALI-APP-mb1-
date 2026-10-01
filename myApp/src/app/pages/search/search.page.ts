import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonSearchbar, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, homeOutline, personCircleOutline, searchOutline, trendingUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  imports: [FormsModule, RouterLink, IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonSearchbar, IonToolbar],
})
export class SearchPage {
  query = '';
  readonly people = [
    { name: 'Jordan Cruz', username: '@jordan.cruz', icon: 'person-circle-outline' },
    { name: 'Mika Santos', username: '@mika.santos', icon: 'person-circle-outline' },
    { name: 'Ari Mendoza', username: '@ari.mendoza', icon: 'person-circle-outline' },
  ];
  readonly topics = ['Good questions', 'Creative practice', 'Daily reflections', 'Community care'];

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, homeOutline, personCircleOutline, searchOutline, trendingUpOutline });
  }

  get filteredPeople() {
    const query = this.query.trim().toLowerCase();
    return this.people.filter((person) => `${person.name} ${person.username}`.toLowerCase().includes(query));
  }

  get filteredTopics() {
    const query = this.query.trim().toLowerCase();
    return this.topics.filter((topic) => topic.toLowerCase().includes(query));
  }
}