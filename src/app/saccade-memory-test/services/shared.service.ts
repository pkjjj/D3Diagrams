import { Injectable } from '@angular/core';
import { ICamMessage } from '../models/charts.model';

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

        let jsonObject = JSON.parse(parsedString);
        jsonObject.pop();
        jsonObject.shift();

        return jsonObject;
    }
}
