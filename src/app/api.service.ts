import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable()
export class ApiService {

  constructor(private http: HttpClient) { }

  /**
   * Get a status of the blockchain.
   */
  getBlock() {
    return this.http.get('https://blockchain.info/ticker')
      .pipe(catchError(() => of(null)));
  }

  /**
   * Get a random Chuck Norris quote.
   */
  getChuck() {
    return this.http.get('https://api.chucknorris.io/jokes/random')
      .pipe(catchError(() => of(null)));
  }

}