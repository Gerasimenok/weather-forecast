import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private _unit = signal<'metric' | 'imperial'>(this.loadUnit());
  private _theme = signal<'light' | 'dark'>(this.loadTheme());
  private _defaultCity = signal<string>(this.loadDefaultCity());
  private _weatherBackground = signal<boolean>(this.loadWeatherBackground());

  unit = this._unit.asReadonly();
  theme = this._theme.asReadonly();
  defaultCity = this._defaultCity.asReadonly();
  weatherBackground = this._weatherBackground.asReadonly();

  setUnit(unit: 'metric' | 'imperial') {
    this._unit.set(unit);
    localStorage.setItem('unit', unit);
  }

  toggleTheme() {
    const newTheme = this._theme() === 'light' ? 'dark' : 'light';
    this._theme.set(newTheme);
    localStorage.setItem('theme', newTheme);
    
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${newTheme}-theme`);
  }

  setDefaultCity(city: string) {
    this._defaultCity.set(city);
    localStorage.setItem('defaultCity', city);
  }

  toggleWeatherBackground() {
    const newValue = !this._weatherBackground();
    this._weatherBackground.set(newValue);
    localStorage.setItem('weatherBackground', JSON.stringify(newValue));
  }

  private loadUnit(): 'metric' | 'imperial' {
    const saved = localStorage.getItem('unit');
    return saved === 'imperial' ? 'imperial' : 'metric';
  }

  private loadTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' ? 'dark' : 'light';
  }

  private loadDefaultCity(): string {
    return localStorage.getItem('defaultCity') || '';
  }

  private loadWeatherBackground(): boolean {
    const saved = localStorage.getItem('weatherBackground');
    return saved ? JSON.parse(saved) : false;
  }
}