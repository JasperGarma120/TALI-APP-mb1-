import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonSearchbar, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, homeOutline, personCircleOutline, searchOutline, trendingUpOutline } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  imports: [FormsModule, RouterLink, IonAvatar, IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonSearchbar, IonToolbar],
})
export class SearchPage {
  readonly accountService = inject(AccountService);
  query = '';
  readonly topics = ['Good questions', 'Creative practice', 'Daily reflections', 'Community care'];

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, homeOutline, personCircleOutline, searchOutline, trendingUpOutline });
  }

  get filteredPeople() {
    const query = this.query.trim().toLowerCase();
    const selectedId = this.accountService.selectedAccount()?.id;
    return this.accountService.accounts()
      .filter((person) => person.id !== selectedId)
      .filter((person) => `${person.name} ${person.username}`.toLowerCase().includes(query));
  }

  get filteredTopics() {
    const query = this.query.trim().toLowerCase();
    return this.topics.filter((topic) => topic.toLowerCase().includes(query));
  }
}