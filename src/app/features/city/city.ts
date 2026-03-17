import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TranslateModule } from '@ngx-translate/core'; 

import { WeatherService } from '../../core/services/weather.service';
import { HistoryService } from '../../core/services/history.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [
    CommonModule, 
    NgApexchartsModule,
    TranslateModule 
  ],
  templateUrl: './city.html',
  styleUrls: ['./city.scss']
})
export class CityComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private weatherService = inject(WeatherService);
  private historyService = inject(HistoryService);
  private settingsService = inject(SettingsService);

  weather = signal<any>(null);
  forecast = signal<any[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  historicalData = signal<any[]>([]);
  historicalChartOptions: any = {
    series: [
      { name: 'Temperature', data: [] },
      { name: 'Precipitation', data: [] }
    ],
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: true }
    },
    stroke: {
      curve: 'smooth',
      width: [3, 2]
    },
    colors: ['#FF4560', '#00E396'],
    xaxis: {
      categories: []
    },
    title: {
      text: 'Weather History (Last 7 Days)',
      align: 'left'
    }
  };

  get unit() {
    return this.settingsService.unit;
  }

  ngOnInit() {
    const cityName = this.route.snapshot.paramMap.get('name');

    if (cityName) {
      this.loadCityWeather(cityName);
    } else {
      this.error.set('City not specified');
      this.loading.set(false);
    }
  }

  private loadCityWeather(cityName: string) {
    this.weatherService.searchCities(cityName).subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          const city = data[0];
          
          this.loadCurrentWeather(city.lat, city.lon, city.name);
          this.loadForecast(city.lat, city.lon);
          this.generateHistoricalData(city.name);
        } else {
          this.error.set('City not found');
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('Error loading city data');
        this.loading.set(false);
      }
    });
  }

  private loadCurrentWeather(lat: number, lon: number, cityName: string) {
    this.weatherService.getCurrentWeather(lat, lon).subscribe({
      next: (weather: any) => {
        this.weather.set(weather);
        this.loading.set(false);
        this.historyService.add(cityName);
      },
      error: () => {
        this.error.set('Error loading weather');
        this.loading.set(false);
      }
    });
  }

  private loadForecast(lat: number, lon: number) {
    this.weatherService.getForecast(lat, lon).subscribe({
      next: (data: any) => {
        if (data && data.list) {
          const daily = data.list.filter((item: any) =>
            item.dt_txt.includes('12:00:00')
          );
          this.forecast.set(daily);
        }
      },
      error: () => {}
    });
  }

  private generateHistoricalData(cityName: string) {
    const historical = [];
    const today = new Date();
    
    const currentTemp = this.weather()?.main?.temp || 10;
    
    for (let i = 7; i > 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const tempVariation = (Math.random() * 6) - 3;
      const temp = currentTemp + tempVariation;
      const precipitation = Math.random() * 5;
      
      historical.push({
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        temp: Number(temp.toFixed(1)),
        precipitation: Number(precipitation.toFixed(1))
      });
    }
    
    this.historicalData.set(historical);
    this.updateHistoricalChart();
  }

  private updateHistoricalChart() {
    const data = this.historicalData();
    const currentUnit = this.unit(); 
    
    const temps = data.map(d => 
      currentUnit === 'imperial' ? (d.temp * 9/5) + 32 : d.temp
    );
    const precip = data.map(d => d.precipitation);
    const dates = data.map(d => d.date);

    this.historicalChartOptions = {
      ...this.historicalChartOptions,
      series: [
        { 
          name: currentUnit === 'metric' ? 'Temperature °C' : 'Temperature °F', 
          data: temps 
        },
        { name: 'Precipitation mm', data: precip }
      ],
      xaxis: { categories: dates }
    };
  }

  convertTemperature(tempInCelsius: number): number {
    const currentUnit = this.unit(); 
    if (currentUnit === 'imperial') {
      return Math.round((tempInCelsius * 9/5) + 32);
    }
    return Math.round(tempInCelsius);
  }
}