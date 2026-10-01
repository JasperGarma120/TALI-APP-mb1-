import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonAvatar, IonFooter } from '@ionic/angular';
import { AccountService } from '../../services/account.service';
import { PostService } from '../../services/post.service';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addCircle, chatbubbleOutline, ellipsisHorizontal, heartOutline, homeSharp, personCircleOutline, personOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonAvatar, IonFooter, CommonModule, FormsModule, RouterLink]
})
export class HomePage {
  readonly accountService = inject(AccountService);
  readonly postService = inject(PostService);

  constructor() {
    addIcons({ addCircle, chatbubbleOutline, ellipsisHorizontal, heartOutline, homeSharp, personCircleOutline, personOutline, searchOutline });
  }
}
