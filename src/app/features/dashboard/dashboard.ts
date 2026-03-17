import { Component, signal, inject, effect } from '@angular/core';
import { WeatherService } from '../../core/services/weather.service';
import { CityService } from '../../core/services/city.service';
import { HistoryService } from '../../core/services/history.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { BackgroundService } from '../../core/services/background.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, RouterModule, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {
  private weatherService = inject(WeatherService);
  private cityService = inject(CityService);
  private historyService = inject(HistoryService);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translationService = inject(TranslationService);
  private backgroundService = inject(BackgroundService);
  
  private isLoading = false;
  private currentCityCoord: { lat: number; lon: number } | null = null;
  private initialLoadDone = false;
  private selectedCityName: string | null = null;

  cityQuery = '';

  suggestions = signal<any[]>([]);
  weather = signal<any>(null);
  forecast = signal<any[]>([]);

  favorites = this.cityService.favorites;
  history = this.historyService.history;
  unit = this.settingsService.unit;
  theme = this.settingsService.theme;

  chartOptions: any = {
    series: [],
    chart: {
      type: 'line',
      height: 350
    },
    xaxis: {
      categories: []
    }
  };

  searchFilters = signal({
    country: '',
    minPopulation: 0,
    maxPopulation: 10000000,
    region: ''
  });

  showFilters = signal(false);

  constructor() {
    effect(() => {
      const currentUnit = this.settingsService.unit();
      if (this.currentCityCoord && !this.isLoading) {
        this.isLoading = true;
        this.loadWeather(this.currentCityCoord.lat, this.currentCityCoord.lon);
      }
    });
  
    effect(() => {
      const defaultCity = this.settingsService.defaultCity();
      if (defaultCity && defaultCity.length > 0 && !this.isLoading) {
        const currentWeather = this.weather();
        if (!currentWeather || currentWeather.name !== defaultCity) {
          this.isLoading = true;
          this.loadDefaultCity(defaultCity);
        }
      }
    });
  
    const initialDefaultCity = this.settingsService.defaultCity();
    if (initialDefaultCity && !this.initialLoadDone) {
      this.initialLoadDone = true;
      this.isLoading = true;
      this.loadDefaultCity(initialDefaultCity);
    }
  }
  
  private loadDefaultCity(cityName: string) {
    this.weatherService.searchCities(cityName).subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          const city = data[0];
          this.cityQuery = city.name;
          this.currentCityCoord = { lat: city.lat, lon: city.lon };
          this.selectedCityName = city.name;
          this.loadWeather(city.lat, city.lon);
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get currentLang() {
    return this.translationService.currentLang();
  }

  toggleTheme() {
    this.settingsService.toggleTheme();
  }

  changeUnit(unit: 'metric' | 'imperial') {
    this.settingsService.setUnit(unit);
  }

  setLang(lang: string) {
    this.translationService.switchLanguage(lang);
  }

  searchCity() {
    const query = this.cityQuery?.trim();
    
    if (!query || query.length < 2) {
      this.suggestions.set([]);
      return;
    }
    
    this.weatherService.searchCities(query, this.searchFilters())
      .subscribe({
        next: (data: any) => {
          this.suggestions.set(data || []);
        },
        error: () => {
          this.suggestions.set([]);
        }
      });
  }

  selectCity(city: any) {
    if (!city || !city.lat || !city.lon) return;

    this.cityQuery = city.name || '';
    this.currentCityCoord = { lat: city.lat, lon: city.lon };
    this.selectedCityName = city.name;
    this.loadWeather(city.lat, city.lon);
    this.historyService.add(city.name || 'Unknown');
    this.suggestions.set([]);
  }

  loadWeather(lat: number, lon: number) {
    this.currentCityCoord = { lat, lon };
    
    this.weatherService.getCurrentWeather(lat, lon)
      .subscribe({
        next: (data: any) => {
          if (!data) {
            this.isLoading = false;
            return;
          }
          
          if (this.selectedCityName && this.selectedCityName.toLowerCase() !== data.name?.toLowerCase()) {
            data.displayName = this.selectedCityName;
          }
          
          this.weather.set(data);
          this.isLoading = false;
          
          const condition = data.weather?.[0]?.main;
          if (condition) {
            this.backgroundService.updateBackground(condition);
          }
        },
        error: () => {
          this.isLoading = false;
        }
      });

    this.weatherService.getForecast(lat, lon)
      .subscribe({
        next: (data: any) => {
          if (!data?.list) return;
          
          const dailyForecast = data.list.filter((item: any) =>
            item.dt_txt.includes('12:00:00')
          );
          this.forecast.set(dailyForecast);
          this.updateChart(dailyForecast);
        },
        error: () => {}
      });
  }

  updateChart(data: any[]) {
    const temps = data.map(d => d.main.temp);
    const dates = data.map(d => new Date(d.dt_txt).toLocaleDateString());

    this.chartOptions = {
      series: [{ name: 'Temperature', data: temps }],
      chart: { type: 'line', height: 350 },
      xaxis: { categories: dates }
    };
  }

  addToFavorites() {
    const city = this.weather();
    if (!city) return;

    this.cityService.add({
      name: city.displayName || city.name,
      temp: city.main.temp,
      country: city.sys?.country || 'Unknown'
    });
  }

  removeFavorite(cityName: string) {
    this.cityService.remove(cityName);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get groupedFavorites() {
    return this.cityService.groupedFavorites;
  }

  setGroupBy(method: 'none' | 'country') {
    this.cityService.setGroupBy(method);
  }

  setSortOrder(order: 'asc' | 'desc') {
    this.cityService.setSortOrder(order);
  }

  get currentGroupBy() {
    return this.cityService.groupBy();
  }

  get currentSortOrder() {
    return this.cityService.sortOrder();
  }

  get sortedFavorites() {
    const favorites = this.favorites();
    const order = this.currentSortOrder;
    return [...favorites].sort((a, b) => order === 'desc' ? b.temp - a.temp : a.temp - b.temp);
  }

  convertTemperature(tempInCelsius: number): number {
    return this.settingsService.unit() === 'imperial' 
      ? Math.round((tempInCelsius * 9/5) + 32)
      : Math.round(tempInCelsius);
  }

  isNearbyCity(city: any): boolean {
    try {
      const currentWeather = this.weather();
      if (!currentWeather?.coord || !city?.lat || !city?.lon) return false;
      
      const lat1 = currentWeather.coord.lat;
      const lon1 = currentWeather.coord.lon;
      const lat2 = city.lat;
      const lon2 = city.lon;
      
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      return (R * c) < 100;
    } catch {
      return false;
    }
  }

  getCountryFullName(countryCode: string): string {
    const countryNames: { [key: string]: string } = {
      'DE': 'Germany', 'CH': 'Switzerland', 'BE': 'Belgium', 'GB': 'United Kingdom',
      'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'PT': 'Portugal',
      'NL': 'Netherlands', 'AT': 'Austria', 'US': 'United States', 'CA': 'Canada',
      'AU': 'Australia', 'NZ': 'New Zealand', 'JP': 'Japan', 'CN': 'China',
      'IN': 'India', 'BR': 'Brazil', 'RU': 'Russia'
    };
    return countryNames[countryCode] || countryCode;
  }

  get isAdmin() {
    return this.authService.isAdmin();
  }

  get displayCities() {
    return this.cityService.displayCities;
  }

  get pinnedCities() {
    return this.cityService.pinnedCities;
  }

  pinCity(city: any) {
    this.cityService.pinCity(city);
  }

  unpinCity(cityName: string) {
    this.cityService.unpinCity(cityName);
  }
}