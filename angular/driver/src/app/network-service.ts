import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineStatus$: BehaviorSubject<boolean>;

  constructor() {
    // Initialize with the current browser status
    this.onlineStatus$ = new BehaviorSubject<boolean>(navigator.onLine);
    this.listenToNetworkChanges();
  }

  private listenToNetworkChanges(): void {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(this.onlineStatus$);
  }

  // Expose as an Observable to monitor changes
  get isOnline$(): Observable<boolean> {
    return this.onlineStatus$.asObservable();
  }

  // Direct snapshot check
  get isOnline(): boolean {
    return navigator.onLine;
  }
}