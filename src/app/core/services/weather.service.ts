import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SettingsService } from './settings.service';

export interface City {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  population?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private http = inject(HttpClient);
  private settings = inject(SettingsService);

  private countryNameToCode: { [key: string]: string } = {
    'germany': 'DE',
    'deutschland': 'DE',
    'france': 'FR',
    'fra': 'FR',
    'francia': 'FR',
    'italy': 'IT',
    'italia': 'IT',
    'spain': 'ES',
    'espana': 'ES',
    'portugal': 'PT',
    'netherlands': 'NL',
    'holland': 'NL',
    'belgium': 'BE',
    'belgique': 'BE',
    'switzerland': 'CH',
    'suisse': 'CH',
    'austria': 'AT',
    'osterreich': 'AT',
    'uk': 'GB',
    'united kingdom': 'GB',
    'england': 'GB',
    'britain': 'GB',
    'usa': 'US',
    'united states': 'US',
    'america': 'US',
    'canada': 'CA',
    'mexico': 'MX',
    'brasil': 'BR',
    'brazil': 'BR',
    'argentina': 'AR',
    'japan': 'JP',
    'nippon': 'JP',
    'china': 'CN',
    'india': 'IN',
    'south korea': 'KR',
    'australia': 'AU',
    'new zealand': 'NZ',
    'russia': 'RU',
    'poland': 'PL',
    'czech republic': 'CZ',
    'hungary': 'HU',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'greece': 'GR',
    'turkey': 'TR'
  };

  private regionMap: { [key: string]: string[] } = {
    'Africa': ['ZA', 'EG', 'NG', 'KE', 'MA', 'DZ', 'TN', 'GH', 'ET', 'TZ', 'UG', 'ZW'],
    'Americas': ['US', 'CA', 'BR', 'AR', 'MX', 'CO', 'CL', 'PE', 'VE', 'UY', 'EC', 'BO'],
    'Asia': ['CN', 'IN', 'JP', 'KR', 'TH', 'VN', 'ID', 'MY', 'PH', 'SG', 'PK', 'BD'],
    'Europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PT', 
                'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'GR', 'IE', 'RO',
                'BG', 'HR', 'RS', 'SK', 'SI', 'LT', 'LV', 'EE', 'IS', 'LU'],
    'Oceania': ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF']
  };

  searchCities(query: string, filters?: any): Observable<City[]> {
    if (!query || query.length < 2) {
      return new Observable(observer => observer.next([]));
    }

    let params: any = {
      q: query,
      limit: 20,
      appid: environment.weatherApiKey
    };
  
    if (filters?.country && filters.country.trim()) {
      const countryInput = filters.country.toLowerCase().trim();
      
      if (countryInput.length === 2) {
        params.q = `${query},${countryInput.toUpperCase()}`;
      } else {
        const countryCode = this.countryNameToCode[countryInput];
        if (countryCode) {
          params.q = `${query},${countryCode}`;
        } else {
          let foundCode = null;
          for (const [name, code] of Object.entries(this.countryNameToCode)) {
            if (name.startsWith(countryInput) || countryInput.startsWith(name.substring(0, 3))) {
              foundCode = code;
              break;
            }
          }
          
          if (foundCode) {
            params.q = `${query},${foundCode}`;
          } else {
            params.q = `${query},${countryInput}`;
          }
        }
      }
    }
  
    return this.http.get<any[]>(
      `https://api.openweathermap.org/geo/1.0/direct`,
      { params }
    ).pipe(
      map((cities: any[]) => {
        let filtered = cities;
        
        if (filters?.minPopulation && filters.minPopulation > 0) {
          filtered = filtered.filter(city => 
            city.population && city.population >= filters.minPopulation
          );
        }
        
        if (filters?.maxPopulation && filters.maxPopulation < 10000000) {
          filtered = filtered.filter(city => 
            city.population && city.population <= filters.maxPopulation
          );
        }
        
        if (filters?.country || filters?.region) {
          filtered = filtered.filter(city => {
            let matchesRegion = true;
            let matchesCountry = true;
            
            if (filters?.region && filters.region !== 'Any') {
              const countriesInRegion = this.regionMap[filters.region] || [];
              matchesRegion = countriesInRegion.includes(city.country);
            }
            
            if (filters?.country && filters.country.trim()) {
              const countryInput = filters.country.toLowerCase().trim();
              
              let targetCountryCode = null;
              
              if (countryInput.length === 2) {
                targetCountryCode = countryInput.toUpperCase();
              } else {
                targetCountryCode = this.countryNameToCode[countryInput];
              }
              
              if (targetCountryCode) {
                matchesCountry = city.country.toUpperCase() === targetCountryCode.toUpperCase();
              } else {
                matchesCountry = true;
              }
            }
            
            return matchesRegion && matchesCountry;
          });
        }
        
        return filtered;
      })
    );
  }

  getCurrentWeather(lat: number, lon: number) {
    return this.http.get(
      `${environment.weatherApiUrl}/weather`,
      {
        params: {
          lat,
          lon,
          appid: environment.weatherApiKey,
          units: this.settings.unit()
        }
      }
    );
  }

  getForecast(lat: number, lon: number) {
    return this.http.get(
      `${environment.weatherApiUrl}/forecast`,
      {
        params: {
          lat,
          lon,
          appid: environment.weatherApiKey,
          units: this.settings.unit()
        }
      }
    );
  }
  
  getWeatherIcon(icon: string) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }
}