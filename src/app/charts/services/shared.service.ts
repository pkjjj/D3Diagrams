import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

    constructor() { }

    public convertTimestampToSeconds(timestamp: number) {
        return new Date(timestamp/1e4).getTime() / 1000;
    }

}
