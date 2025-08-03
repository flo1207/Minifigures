import { Component, OnInit, HostListener } from '@angular/core';
import { MinifigureService } from '../../services/minifigure.service';
import { CommonModule } from '@angular/common'; // Common Angular directives and pipes
import { FormsModule } from '@angular/forms';  // Forms support for template-driven forms
import { GraphComponent } from '../graph/graph.component';

@Component({
  selector: 'app-minifigures',
  standalone: true,
  imports: [CommonModule, FormsModule, GraphComponent], // Import necessary modules and components
  templateUrl: './minifigures.component.html',
  styleUrls: ['./minifigures.component.css']
})
export class MinifiguresComponent implements OnInit {
  // Array to hold all minifigures retrieved from the service
  minifigures: any[] = [];
  
  // Backup copy of original data, useful for resetting filters
  minifigures_original: any[] = [];
  
  // Array to hold the filtered minifigures when a search/filter is applied
  filteredMinifigures: any[] = [];

  // Variables to hold the total prices of used and new minifigures
  totalUsedPrice: number = 0;
  totalUsedPrice2: number = 0;
  totalNewPrice: number = 0;
  totalNewPrice2: number = 0;

  // The ID entered by the user to add or filter minifigures
  minifigId: string = '';

  // Variable to determine if the code is running in a browser environment
  isBrowser: boolean = false;

  // Variables to store the initial vertical position and height of the "Recherche" section for scroll handling
  initialOffsetTop = 0;
  sectionHeight = 0;

  // Variables to manage sorting state of the minifigures table
  sortKey: string = 'Minifig number'; // Default column to sort by
  sortOrder: string = 'asc';           // Default sort order: ascending

  // Flag to indicate if the update (MAJ) operation is in progress (used to show loading state)
  isMAJLoading = false;

  // Variable to track whether the search/filter section should be fixed on scroll
  isFixed = false;

  constructor(private minifigureService: MinifigureService) {
    // Initialize filteredMinifigures with all minifigures at component creation
    this.filteredMinifigures = [...this.minifigures];
  }

  // Listen to window scroll events to toggle fixed positioning of the search section
  @HostListener('window:scroll', [])
  onScroll(): void {
    const offset = window.pageYOffset || document.documentElement.scrollTop;

    if (offset >= this.initialOffsetTop) {
      this.isFixed = true; // Fix the search section when scrolled past initial offset
    } else {
      this.isFixed = false; // Unfix when scrolled back above offset
    }
  }

  // Angular lifecycle hook called after component initialization
  ngOnInit(): void {
    this.loadMinifigures();

    // Store the initial offset top and height of the '.Recherche' section for scroll behavior
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const section = document.querySelector('.Recherche') as HTMLElement;
      if (section) {
        this.initialOffsetTop = section.offsetTop;
        this.sectionHeight = section.offsetHeight;
      }
    }
  }

  // Load minifigures data from the service asynchronously
  async loadMinifigures(): Promise<void> {
    this.minifigureService.getMinifigures().subscribe(data => {
      this.minifigures = data;
      this.minifigures_original = data;
      
      // Calculate the total used and new prices after loading
      this.calculateTotalUsedPrice();
      this.calculateTotalNewPrice();

      // If there's an ID entered, apply filtering
      if(this.minifigId) this.filterMinifigures();
    });
  }

  // Calculate the total price of used minifigures (full list and filtered list)
  calculateTotalUsedPrice(): void {
    // Sum prices for all minifigures
    this.totalUsedPrice = parseFloat(this.minifigures.reduce((total, figure) => {
      const usedPrice = figure['Current value']?.used_price
        ? parseFloat(figure['Current value'].used_price)
        : 0;
      const quantity = figure.Quantité ? parseInt(figure.Quantité, 10) : 1;
      return total + (usedPrice * quantity);
    }, 0).toFixed(2));

    // Sum prices for filtered minifigures
    this.totalUsedPrice2 = parseFloat(this.filteredMinifigures.reduce((total, figure) => {
      const usedPrice = figure['Current value']?.used_price
        ? parseFloat(figure['Current value'].used_price)
        : 0;
      const quantity = figure.Quantité ? parseInt(figure.Quantité, 10) : 1;
      return total + (usedPrice * quantity);
    }, 0).toFixed(2));
  }

  // Calculate the total price of new minifigures (full list and filtered list)
  calculateTotalNewPrice(): void {
    // Sum new prices for all minifigures
    this.totalNewPrice = parseFloat(this.minifigures.reduce((total, figure) => {
      const newPrice = figure['Current value']?.new_price
        ? parseFloat(figure['Current value'].new_price)
        : 0;
      const quantity = figure.Quantité ? parseInt(figure.Quantité, 10) : 1;
      return total + (newPrice * quantity);
    }, 0).toFixed(2));

    // Sum new prices for filtered minifigures
    this.totalNewPrice2 = parseFloat(this.filteredMinifigures.reduce((total, figure) => {
      const newPrice = figure['Current value']?.new_price
        ? parseFloat(figure['Current value'].new_price)
        : 0;
      const quantity = figure.Quantité ? parseInt(figure.Quantité, 10) : 1;
      return total + (newPrice * quantity);
    }, 0).toFixed(2));
  }

  // Add a minifigure by its ID using the service
  async addMinifigure(): Promise<void> {
    if (this.minifigId.trim() === '') {
      alert('Please enter a valid minifigure ID.');
      return;
    }

    (await this.minifigureService.addMinifigureById(this.minifigId)).subscribe(
      (response) => {
        console.log('Minifigure added/updated:', response);
        this.loadMinifigures();  // Refresh the list after adding
      },
      (error) => {
        console.error('Error adding minifigure:', error);
      }
    );
  }

  // Delete a minifigure by its ID and remove it locally from the array
  async deleteMinifigure(index: number, minifigId: string) {
    (await this.minifigureService.deleteMinifigure(minifigId)).subscribe(response => {
      this.minifigures.splice(index, 1);  // Remove from local array
      this.calculateTotalUsedPrice();     // Recalculate totals after deletion
    });
  }

  // Update minifigure list by fetching fresh data (show loading indicator)
  async MAJMinifigure(): Promise<void> {
    try {
      this.isMAJLoading = true; // Show loading state
      (await this.minifigureService.getMAJMinifigures()).subscribe({
        next: (data) => {
          this.minifigures = data;
          this.calculateTotalUsedPrice(); // Recalculate totals
          this.isMAJLoading = false;      // Hide loading state
        },
        error: (err) => {
          console.error('Error during update:', err);
          this.isMAJLoading = false;
        }
      });
    } catch (err) {
      console.error('Error in MAJMinifigure method:', err);
      this.isMAJLoading = false;
    }
  }

  // Boolean array to track visibility of the graph component per minifigure row
  isBrowserArray: boolean[] = [];

  // Toggle the visibility of the graph for a specific minifigure index
  toggleGraphVisibility(index: number): void {
    this.isBrowserArray[index] = !this.isBrowserArray[index];
  }

  // Sort the minifigures table by a given key in ascending or descending order
  sortTable(key: string): void {
    if (this.sortKey === key) {
      // If sorting by same key, toggle order
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Otherwise, set new sort key and default to ascending
      this.sortKey = key;
      this.sortOrder = 'asc';
    }
  
    this.minifigures = this.minifigures.sort((a: any, b: any) => {
      // Helper to get nested object property by path
      const getValue = (obj: any, path: string) =>
        path.split('.').reduce((acc, part) => acc && acc[part], obj);
  
      const valueA = getValue(a, key);
      const valueB = getValue(b, key);
  
      // Handle null or undefined values to push them to the end
      if (valueA == null) return 1;
      if (valueB == null) return -1;
  
      // Numeric comparison if both are numbers
      if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
        const numA = Number(valueA);
        const numB = Number(valueB);
  
        if (numA > numB) return this.sortOrder === 'asc' ? 1 : -1;
        if (numA < numB) return this.sortOrder === 'asc' ? -1 : 1;
      }
  
      // String comparison for text values with locale support
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
  
      return 0; // Consider equal if neither numeric nor string
    });
  }
  
  // Filter minifigures based on the minifigId input by searching all string fields
  filterMinifigures() {
    const searchTerm = this.minifigId.toLowerCase();

    this.filteredMinifigures = this.minifigures.filter(figure =>
      Object.keys(figure).some(key => {
        const value = figure[key];

        // Only check string properties for search match
        return typeof value === 'string' && value.toLowerCase().includes(searchTerm);
      })
    );

    // Recalculate totals based on filtered list
    this.calculateTotalUsedPrice();
    this.calculateTotalNewPrice();
  }

  // Update the quantity of a minifigure by ID using the service
  updateQtt(qtt:number, id:string){
    this.minifigureService.updateQuantity(id, qtt).subscribe({
      next: (response) => {
        console.log('Quantity updated successfully', response);
      },
      error: (error) => {
        console.error('Error updating quantity', error);
      }
    });
  }
}
