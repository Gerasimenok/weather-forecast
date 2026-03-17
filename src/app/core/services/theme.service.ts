import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private storage = new StorageService();

  theme = signal<'light' | 'dark'>('light');

  constructor() {

    const savedTheme = this.storage.get('theme');

    if (savedTheme) {
      this.theme.set(savedTheme);
      document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    }

  }

  toggleTheme() {

    const newTheme = this.theme() === 'light' ? 'dark' : 'light';

    this.theme.set(newTheme);

    document.body.classList.toggle('dark-theme');

    this.storage.set('theme', newTheme);

  }

}