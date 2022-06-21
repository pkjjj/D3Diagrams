import { Injectable } from '@angular/core';

@Injectable()
export class JsonService {

    public parseStringToJson(data: string): object | string {
        let parsedString = data.replace(/\s/g, '')
          .replace(/<([^}]+){/g, '{')
          .replace(/}/g, '},')
          .slice(0, -1);

        parsedString = '[' + parsedString + ']';

        const jsonObject = JSON.parse(parsedString);
        jsonObject.pop();
        jsonObject.shift();

        return jsonObject;
    }
}
