import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http'; // Nouvelle méthode Angular 16+
import { bootstrapApplication } from '@angular/platform-browser';
import { MinifiguresComponent } from './components/minifigures/minifigures.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MinifiguresComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}
