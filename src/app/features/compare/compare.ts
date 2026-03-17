import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

import { WeatherService } from '../../core/services/weather.service';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './compare.html',
  styleUrls: ['./compare.scss']
})
export class CompareComponent {

  private weatherService = inject(WeatherService);

  cityQuery = '';
  suggestions = signal<any[]>([]);

  selectedCities = signal<string[]>([]);
  
  private forecastData = signal<Map<string, any[]>>(new Map());

  chartOptions: any = {
    series: [],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: true
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 5
    },
    xaxis: {
      categories: []
    },
    title: {
      text: 'Temperature Comparison (°C)',
      align: 'left'
    },
    colors: ['#FF4560', '#00E396', '#775DD0']
  };

  searchCity() {
    const query = this.cityQuery.trim();

    if (query.length < 2) {
      this.suggestions.set([]);
      return;
    }

    this.weatherService.searchCities(query)
      .subscribe((data: any) => {
        this.suggestions.set(data);
      });
  }

  selectCity(city: any) {
    this.cityQuery = `${city.name}, ${city.country}`;
    this.addCity();
    this.suggestions.set([]);
  }

  addCity() {
    const cityName = this.cityQuery.split(',')[0].trim();
    
    if (!cityName) return;

    if (this.selectedCities().length >= 3) {
      alert('Maximum 3 cities allowed');
      return;
    }
    
    if (this.selectedCities().includes(cityName)) {
      alert('City already added');
      return;
    }

    this.selectedCities.update(c => [...c, cityName]);
    this.loadForecast(cityName);
    this.cityQuery = '';
  }

  loadForecast(city: string) {
    this.weatherService.searchCities(city)
      .subscribe((data: any) => {
        if (!data.length) return;

        const lat = data[0].lat;
        const lon = data[0].lon;

        this.weatherService.getForecast(lat, lon)
          .subscribe((forecast: any) => {
            const daily = forecast.list.filter((item: any) =>
              item.dt_txt.includes('12:00:00')
            );

            this.forecastData.update(oldMap => {
              const newMap = new Map(oldMap);
              newMap.set(city, daily);
              return newMap;
            });

            this.updateChart();
          });
      });
  }

  removeCity(city: string) {
    this.selectedCities.update(cities => cities.filter(c => c !== city));
    
    this.forecastData.update(oldMap => {
      const newMap = new Map(oldMap);
      newMap.delete(city);
      return newMap;
    });
    
    this.updateChart();
  }

  clearAll() {
    this.selectedCities.set([]);
    this.forecastData.set(new Map());
    
    this.chartOptions = {
      ...this.chartOptions,
      series: [],
      xaxis: { categories: [] }
    };
  }

  private updateChart() {
    const series: any[] = [];
    let categories: string[] = [];

    this.forecastData().forEach((daily, city) => {
      const temps = daily.map((d: any) => d.main.temp);
      series.push({
        name: city,
        data: temps
      });

      if (categories.length === 0) {
        categories = daily.map((d: any) => 
          new Date(d.dt_txt).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        );
      }
    });

    this.chartOptions = {
      ...this.chartOptions,
      series,
      xaxis: { categories }
    };
  }

  getCityData(city: string) {
    const data = this.forecastData().get(city);
    if (!data || data.length === 0) return null;
    
    return {
      temp: Math.round(data[0].main.temp),
      condition: data[0].weather[0].description,
      icon: data[0].weather[0].icon
    };
  }
}