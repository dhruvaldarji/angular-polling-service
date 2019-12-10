import { Component, OnDestroy } from '@angular/core';
import {
  of,
  Observable,
  BehaviorSubject,
  Subscription,
  Subject,
  timer,
} from 'rxjs';
import {
  switchMap,
  concatMap,
  takeUntil,
  skip,
  tap,
  debounceTime,
} from 'rxjs/operators';

import { ApiService } from './api.service';
import { Source, SourceLabels } from './source';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnDestroy {
  name = 'Angular Polling Service';

  sourceEn = Source;
  data$ = new BehaviorSubject<any>(null);
  interval$ = new BehaviorSubject<number>(2000);
  source$ = new BehaviorSubject<Source>(Source.chuck);
  sourceList$ = this.getSourceList();
  private poll$: Subscription;  
  private stop$: Subject<any>;
  private destroy$ = new Subject();

  constructor(private apiService: ApiService) {}

  /** Destroy the component on unload. */
  ngOnDestroy() {
    this.stop();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Start Polling based on interval and source. */
  start() {
    // If we have already started the stream do not start again.
    if (this.poll$) {
      console.log('already started');
      return this.poll$;
    }

    console.log('start');
    // Initialize the stop$ Subject.
    this.stop$ = new Subject();
    
    // Start observing the interval.
    this.poll$ = this.interval$.pipe(
      // Disallow multiple updates to the interval.
      debounceTime(250),
      tap((i) => console.log(`Starting Polling @ ${i}`)),
      // Swap in our timer, based on the interval.
      switchMap((interval) => {
        return timer(0, interval);
      }),
      skip(1),
      tap((t) => console.log('Emit timer: ', t)),
      // Swap in source, when timer next emits.
      switchMap(() => this.source$),
      tap((s) => console.log('Using Source: ', s)),
      // Swap in source api, once source itself is retrieved.
      switchMap((source) => {
        return this.getSourceApi(source);
      }),
      takeUntil(this.stop$)
    ).subscribe((response) => {
      console.log('data', response);
      // Do something with the data
      this.data$.next(response || null);
      // NOTE: You can optionally destroy the stream from here as well.
      // this.stop();
    });

    return this.poll$;
  }

  /**
   * Stop polling the data source.
   */
  stop() {
    console.log("stop");
    // Stop the observers, if they exist
    if (this.stop$) {
      this.stop$.next();
    }
    if (this.poll$) {
      this.poll$ = null;
    }
  }

  /** 
   * Set the Poll Interval
   */
  setInterval(value = 5000) {
    this.interval$.next(value)
  }

  /**
   * Set the API Source
   */
  setSource(sourceType = Source.chuck) {
    this.source$.next(sourceType);
  }

  /** 
   * Get the Source Api
   */
  getSourceApi(value = Source.chuck) {
    switch (value) {
      case Source.block: 
        return this.apiService.getBlock();
      case Source.chuck:
      default:
        return this.apiService.getChuck();
    }
  }

  /**
   * Get the list of available Sources.
   */
  getSourceList() {
    const list = Object.keys(Source).map((s) => ({
      label: SourceLabels[Source[s]],
      value: s,
    }));
    console.log(list);
    return of(list);
  }
}
