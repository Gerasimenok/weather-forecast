import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private _loading = signal(false);

  loading = this._loading;

  show() {
    this._loading.set(true);
  }

  hide() {
    this._loading.set(false);
  }

}