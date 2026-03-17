import { Injectable, effect, inject } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class BackgroundService {
  private settingsService = inject(SettingsService);
  private currentWeatherCondition: string = '';

  constructor() {
    effect(() => {
      const enabled = this.settingsService.weatherBackground();
      
      if (!enabled) {
        this.resetToThemeBackground();
      } else if (this.currentWeatherCondition) {
        this.updateBackground(this.currentWeatherCondition);
      }
    });
  }

  updateBackground(weatherCondition: string) {
    this.currentWeatherCondition = weatherCondition;
    
    if (!this.settingsService.weatherBackground()) {
      return;
    }

    this.removeBackgroundClasses();

    const bgClass = this.getBackgroundClass(weatherCondition);
    document.body.classList.add(bgClass);
  }

  private resetToThemeBackground() {
    this.removeBackgroundClasses();
  }

  private removeBackgroundClasses() {
    const body = document.body;
    const classes = Array.from(body.classList);
    
    classes.forEach(className => {
      if (className.includes('-bg')) {
        body.classList.remove(className);
      }
    });
  }

  private getBackgroundClass(condition: string): string {
    const mainCondition = condition.toLowerCase();
    
    if (mainCondition.includes('clear') || mainCondition.includes('sun')) {
      return 'sunny-bg';
    }
    if (mainCondition.includes('rain') || mainCondition.includes('drizzle')) {
      return 'rainy-bg';
    }
    if (mainCondition.includes('cloud')) {
      return 'cloudy-bg';
    }
    if (mainCondition.includes('snow')) {
      return 'snowy-bg';
    }
    if (mainCondition.includes('thunder') || mainCondition.includes('storm')) {
      return 'storm-bg';
    }
    if (mainCondition.includes('mist') || mainCondition.includes('fog')) {
      return 'foggy-bg';
    }
    
    return 'default-bg';
  }
}