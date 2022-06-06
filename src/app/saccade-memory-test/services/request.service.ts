import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

    constructor(private httpClient: HttpClient) { }

    public getMemoryData() {
      return this.httpClient.get('/assets/saccade-memory-test/16522699559352059.log', {responseType: 'text'});
    }
}
