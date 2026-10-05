import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
	selector: 'app-root',
	standalone: true,
	templateUrl: './app.component.html',
	imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
	constructor(router: Router) {
		if (typeof document === 'undefined' || typeof localStorage === 'undefined') return;

		const savedDarkMode = localStorage.getItem('tali-setting-darkMode') ?? localStorage.getItem('tali-dark-mode');
		document.documentElement.classList.toggle('app-light', savedDarkMode === 'false');

		const updateWebShell = (url: string) => {
			const path = url.split(/[?#]/, 1)[0];
			const isSignedInPage = ['/home', '/search', '/messages', '/add-post', '/suggestions', '/profile', '/settings']
				.some((route) => path === route || path.startsWith(`${route}/`));
			document.documentElement.classList.toggle('app-web-shell', isSignedInPage);
		};

		updateWebShell(router.url);
		router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) updateWebShell(event.urlAfterRedirects);
		});
	}
}
