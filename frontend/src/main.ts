import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideCharts(withDefaultRegisterables())], // Configuration du service HttpClient
}).catch((err) => console.error(err));
