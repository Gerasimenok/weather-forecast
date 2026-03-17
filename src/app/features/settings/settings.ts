import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SettingsService } from '../../core/services/settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { WeatherService } from '../../core/services/weather.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  private translationService = inject(TranslationService);
  private weatherService = inject(WeatherService);

  unit = this.settingsService.unit;
  theme = this.settingsService.theme;
  defaultCity = this.settingsService.defaultCity;
  weatherBackground = this.settingsService.weatherBackground;

  defaultCityInput = '';
  suggestions = signal<any[]>([]);

  setUnit(unit: 'metric' | 'imperial') {
    this.settingsService.setUnit(unit);
  }

  toggleTheme() {
    this.settingsService.toggleTheme();
  }

  setLanguage(lang: string) {
    this.translationService.switchLanguage(lang);
  }

  currentLang() {
    return this.translationService.currentLang();
  }

  searchCity() {
    if (!this.defaultCityInput || this.defaultCityInput.length < 2) {
      this.suggestions.set([]);
      return;
    }

    this.weatherService.searchCities(this.defaultCityInput)
      .subscribe((data: any) => {
        this.suggestions.set(data);
      });
  }

  selectCity(city: any) {
    const cityName = city.name;
    this.settingsService.setDefaultCity(cityName);
    this.defaultCityInput = '';
    this.suggestions.set([]);
  }

  clearDefaultCity() {
    this.settingsService.setDefaultCity('');
  }

  toggleWeatherBackground() {
    this.settingsService.toggleWeatherBackground();
  }
}