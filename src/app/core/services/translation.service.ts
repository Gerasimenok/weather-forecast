import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  private translate = inject(TranslateService);

  constructor() {

    this.translate.addLangs(['en', 'ru']);

    const saved = localStorage.getItem('lang') || 'en';

    this.translate.setDefaultLang(saved);
    this.translate.use(saved);

  }

  switchLanguage(lang: string) {

    this.translate.use(lang);

    localStorage.setItem('lang', lang);

  }

  currentLang() {
    return this.translate.currentLang;
  }

}