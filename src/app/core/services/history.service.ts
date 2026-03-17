import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  private storage = new StorageService();

  history = signal<string[]>([]);

  constructor() {

    const saved = this.storage.get('history');

    if (saved) {
      this.history.set(saved);
    }

  }

  add(city: string) {

    const updated = [
      city,
      ...this.history().filter(c => c !== city)
    ].slice(0, 10);

    this.history.set(updated);

    this.storage.set('history', updated);

  }

  clear() {

    this.history.set([]);

    this.storage.remove('history');

  }

}