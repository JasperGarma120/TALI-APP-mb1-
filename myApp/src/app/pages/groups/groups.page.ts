import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonBackButton, IonButton, IonContent, IonHeader, IonToolbar } from '@ionic/angular';

interface CommunityGroup { id: string; name: string; description: string; creator: string; }

@Component({
  standalone: true,
  selector: 'app-groups',
  imports: [FormsModule, IonBackButton, IonButton, IonContent, IonHeader, IonToolbar],
  template: `<ion-header class="page-header ion-no-border"><ion-toolbar><ion-back-button slot="start" defaultHref="/activity" text="Back"></ion-back-button><h1>Groups</h1></ion-toolbar></ion-header>
  <ion-content class="groups-page"><main><section class="groups-hero"><span class="group-mark">G</span><p class="eyebrow">YOUR COMMUNITY</p><h2>Create a group</h2><p>Bring people together around something you love.</p>
    <label>Group name<input [(ngModel)]="name" maxlength="60" placeholder="e.g. Weekend hikers" /></label>
    <label>Description<textarea [(ngModel)]="description" maxlength="240" placeholder="What is this group about?"></textarea></label>
    <ion-button expand="block" [disabled]="!name.trim()" (click)="createGroup()">Create group</ion-button>
  </section><section class="created-groups"><h2>Groups you created</h2>
    @for (group of groups(); track group.id) { <article><span class="group-tile">{{ group.name.slice(0, 1).toUpperCase() }}</span><div><strong>{{ group.name }}</strong><p>{{ group.description || 'A new community group.' }}</p><small>Created by {{ group.creator }}</small></div></article> }
    @empty { <p class="groups-empty">Your groups will appear here after you create one.</p> }
  </section></main></ion-content>`,
  styles: [`:host{display:block;min-height:100%;background:#f4f5f9;color:#11132b}.page-header ion-toolbar{--background:#030319;--color:white;padding:4px 12px}.page-header h1{font-size:1.05rem}.groups-page{--background:#f4f5f9}main{max-width:680px;margin:auto;padding:28px 20px 56px}.groups-hero{background:#fff;border:1px solid #e6e7ef;border-radius:24px;padding:28px;box-shadow:0 14px 34px #11132b0b}.group-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:#ecebff;color:#5549c8;font-size:1.35rem;font-weight:800}.eyebrow{margin:20px 0 7px;color:#6457d9;font-size:.7rem;letter-spacing:.16em;font-weight:800}.groups-hero h2,.created-groups h2{margin:0;font-size:1.45rem}.groups-hero>p:not(.eyebrow){color:#73758a;margin:8px 0 24px}.groups-hero label{display:grid;gap:8px;margin:16px 0;font-size:.85rem;font-weight:700}.groups-hero input,.groups-hero textarea{box-sizing:border-box;width:100%;border:1px solid #dfe0e8;border-radius:12px;padding:12px;font:inherit;font-weight:400;color:#16172b;background:#fff}.groups-hero textarea{min-height:88px;resize:vertical}.groups-hero ion-button{margin-top:20px;--background:#564bd0;--border-radius:12px}.created-groups{margin-top:32px}.created-groups article{display:flex;align-items:center;gap:14px;margin-top:14px;padding:16px;background:white;border:1px solid #e6e7ef;border-radius:16px}.group-tile{display:grid;place-items:center;flex:0 0 46px;height:46px;border-radius:14px;background:#efefff;color:#564bd0;font-size:1.2rem;font-weight:800}.created-groups article p{margin:4px 0;color:#74768a;font-size:.9rem}.created-groups article small,.groups-empty{color:#88899a}.groups-empty{padding:20px 0}`],
})
export class GroupsPage {
  name = '';
  description = '';
  groups = signal<CommunityGroup[]>(loadGroups());

  createGroup() {
    const name = this.name.trim();
    if (!name) return;
    const groups = [{ id: `${Date.now()}`, name, description: this.description.trim(), creator: 'you' }, ...this.groups()];
    this.groups.set(groups);
    try { localStorage.setItem('tali-community-groups', JSON.stringify(groups)); } catch { /* Keep the new group in this view. */ }
    this.name = '';
    this.description = '';
  }
}

function loadGroups(): CommunityGroup[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('tali-community-groups') ?? '[]');
    return Array.isArray(saved) ? saved.filter((item): item is CommunityGroup => !!item && typeof item === 'object' && typeof (item as CommunityGroup).name === 'string' && typeof (item as CommunityGroup).id === 'string') : [];
  } catch { return []; }
}
