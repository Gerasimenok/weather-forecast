import { Injectable, signal, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';

export interface FavoriteCity {
  name: string;
  temp: number;
  country?: string;
  id?: string;
  isPinned?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CityService {

  private authService = inject(AuthService);
  
  private _favorites = signal<FavoriteCity[]>([]);
  private _pinnedCities = signal<FavoriteCity[]>(this.loadPinnedCities()); 
  private _groupBy = signal<'none' | 'country'>('none');
  private _sortOrder = signal<'asc' | 'desc'>('desc');

  favorites = this._favorites.asReadonly();
  pinnedCities = this._pinnedCities.asReadonly();
  groupBy = this._groupBy.asReadonly();
  sortOrder = this._sortOrder.asReadonly();

  constructor() {
    this.loadUserFavorites();
    
    effect(() => {
      this.authService.user();
      this.loadUserFavorites();
    });
  }

  private loadUserFavorites() {
    const user = this.authService.user();
    if (user) {
      const key = `favorites_${user.email}`;
      const saved = localStorage.getItem(key);
      this._favorites.set(saved ? JSON.parse(saved) : []);
    } else {
      this._favorites.set([]);
    }
  }

  private saveUserFavorites(favorites: FavoriteCity[]) {
    const user = this.authService.user();
    if (user) {
      const key = `favorites_${user.email}`;
      localStorage.setItem(key, JSON.stringify(favorites));
    }
  }

  get displayCities() {
    const userFavorites = this._favorites();
    const pinned = this._pinnedCities();
    
    const citiesMap = new Map<string, FavoriteCity>();
    
    pinned.forEach(city => {
      citiesMap.set(city.name, { ...city, isPinned: true });
    });
    
    userFavorites.forEach(city => {
      if (!citiesMap.has(city.name)) {
        citiesMap.set(city.name, { ...city, isPinned: false });
      }
    });
    
    const uniqueCities = Array.from(citiesMap.values());
    return this.sortFavorites(uniqueCities, this._sortOrder());
  }

  get groupedFavorites() {
    const cities = this.displayCities;
    const groupBy = this._groupBy();

    if (groupBy === 'none') {
      return { '': cities };
    }

    if (groupBy === 'country') {
      return this.groupByCountry(cities);
    }

    return { '': cities };
  }

  private sortFavorites(favorites: FavoriteCity[], order: 'asc' | 'desc') {
    return [...favorites].sort((a, b) => {
      return order === 'desc' ? b.temp - a.temp : a.temp - b.temp;
    });
  }

  private groupByCountry(favorites: FavoriteCity[]) {
    return favorites.reduce((groups, city) => {
      const country = city.country || 'Unknown';
      if (!groups[country]) {
        groups[country] = [];
      }
      groups[country].push(city);
      return groups;
    }, {} as Record<string, FavoriteCity[]>);
  }

  pinCity(city: FavoriteCity) {
    if (!this.authService.isAdmin()) return;
    
    const pinned = this._pinnedCities();
    const exists = pinned.find(c => c.name === city.name);
    
    if (!exists) {
      const updated = [...pinned, { ...city, isPinned: true }];
      this._pinnedCities.set(updated);
      this.savePinnedCities(updated);
    }
  }

  unpinCity(cityName: string) {
    if (!this.authService.isAdmin()) return;
    
    const updated = this._pinnedCities().filter(c => c.name !== cityName);
    this._pinnedCities.set(updated);
    this.savePinnedCities(updated);
  }

  add(city: FavoriteCity) {
    const user = this.authService.user();
    if (!user) return;

    const currentFavorites = this._favorites();
    const exists = currentFavorites.find(c => c.name === city.name);
    if (exists) return;

    const updated = [...currentFavorites, city];
    this._favorites.set(updated);
    this.saveUserFavorites(updated);
  }

  remove(cityName: string) {
    const user = this.authService.user();
    if (!user) return;

    const updated = this._favorites().filter(c => c.name !== cityName);
    this._favorites.set(updated);
    this.saveUserFavorites(updated);
  }

  setGroupBy(method: 'none' | 'country') {
    this._groupBy.set(method);
    localStorage.setItem('favoritesGroupBy', method);
  }

  setSortOrder(order: 'asc' | 'desc') {
    this._sortOrder.set(order);
    localStorage.setItem('favoritesSortOrder', order);
  }

  private loadPinnedCities(): FavoriteCity[] {
    const data = localStorage.getItem('pinnedCities');
    return data ? JSON.parse(data) : [];
  }

  private savePinnedCities(pinned: FavoriteCity[]) {
    localStorage.setItem('pinnedCities', JSON.stringify(pinned));
  }
}