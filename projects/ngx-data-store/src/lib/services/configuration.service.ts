import { Injectable } from '@angular/core';
import { Configuration } from '../models/configuration';

@Injectable({ providedIn: 'root' })
export abstract class ConfigurationProvider extends Configuration {

}
