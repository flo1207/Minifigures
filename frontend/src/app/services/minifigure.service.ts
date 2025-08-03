import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Import HttpClient for HTTP requests
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root', // Makes this service available application-wide (singleton)
})
export class MinifigureService {
  // Base URL for the Flask backend API
  private apiUrl = 'http://127.0.0.1:5000';

  // Inject HttpClient into the service for making HTTP calls
  constructor(private http: HttpClient) {}

  // Fetch all minifigures from the API
  getMinifigures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/minifigures`);
  }

  // Add a minifigure by its ID by requesting the backend
  // Returns an Observable of the added minifigure data
  async addMinifigureById(minifigId: string): Promise<Observable<any>> {
    return this.http.get<any>(`${this.apiUrl}/minifigures/${minifigId}`);
  }

  // Delete a minifigure by its ID by sending a DELETE request to the backend
  // Returns an Observable indicating the operation result
  async deleteMinifigure(minifigId: string): Promise<Observable<any>> {
    return this.http.delete(`${this.apiUrl}/minifigures/${minifigId}`);
  }

  // Fetch updated minifigure info from the backend (e.g., updated prices)
  async getMAJMinifigures(): Promise<Observable<any>> {
    return this.http.get<any>(`${this.apiUrl}/maj`);
  }

  // Update the quantity of a minifigure by sending a POST request with id and quantity
  updateQuantity(id: string, quantity: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/update_quantity`, { id, quantity });
  }
}
