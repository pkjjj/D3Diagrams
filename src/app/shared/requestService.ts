import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

    constructor(private httpClient: HttpClient) { }

    public getMemoryData() {
        return this.httpClient.get('/assets/saccade-memory-test/16522699559352059.log', { responseType: 'text' });
    }

    public getSmoothPursuitData() {
        return this.httpClient.get('/assets/smooth-saccade-pursuit-test/16539163825057996.log', { responseType: 'text' });
    }

    public getSmoothPursuitData_1() {
        return this.httpClient.get('/assets/smooth-saccade-pursuit-test/16539164688916374.log', { responseType: 'text' });
    }
}
