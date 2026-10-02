import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
	selector: 'app-root',
	standalone: true,
	templateUrl: './app.component.html',
	imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
	constructor() {
		if (typeof document === 'undefined' || typeof localStorage === 'undefined') return;

		const savedDarkMode = localStorage.getItem('tali-setting-darkMode') ?? localStorage.getItem('tali-dark-mode');
		document.documentElement.classList.toggle('app-light', savedDarkMode === 'false');
	}
}
