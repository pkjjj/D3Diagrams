import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

    constructor() { }

    public convertTimestampToSeconds(timestamp: number) {
        return new Date(timestamp/1e4).getTime() / 1000;
    }

    public parseStringToJson(data: string): object | string {
      let parsedString = data.replace(/\s/g, '')
        .replace(/<([^}]+){/g, '{')
        .replace(/}/g, '},')
        .slice(0, -1);

      parsedString = '[' + parsedString + ']';
      return JSON.parse(parsedString);
  }

}
