import { Component, OnDestroy } from '@angular/core';
import {
  of,
  Observable,
  BehaviorSubject,
  Subject,
  timer,
} from 'rxjs';
import {
  switchMap,
  concatMap,
  takeUntil,
  skip,
  tap,
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
  private poll$: Observable<any>;  
  private destroy$ = new Subject();

  constructor(private apiService: ApiService) {}

  ngOnDestroy() {
    this.destroy$.next();
  }

  start() {
    if (this.poll$) {
      return this.poll$;
    }
    
    this.poll$ = this.interval$.pipe(
      switchMap((interval) => {
        console.log(`Starting Polling @ ${interval}`);
        return timer(0, interval);
      }),
      skip(1),
      tap((t) => console.log('Emit timer: ', t)),
      switchMap(() => this.source$),
      tap((s) => console.log('Using Source: ', s)),
      concatMap((source) => {
        return this.getSourceApi(source);
      }),
    );
    
    this.poll$.pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        console.log('data', response);
        this.data$.next(response || null);
      });

    return this.poll$;
  }

  /**
   * Stop polling the data source.
   */
  stop() {
    console.log("stop");
    this.destroy$.next();
    this.poll$ = null;
  }

  /** 
   * Set the Poll Interval
   */
  setInterval(value = 5000) {
    console.log('set interval:', value);
    this.interval$.next(value)
  }

  /**
   * Set the API Source
   */
  setSource(sourceType = Source.chuck) {
    console.log('set source:', sourceType);
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
