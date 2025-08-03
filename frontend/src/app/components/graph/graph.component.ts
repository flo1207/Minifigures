import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import Angular common directives and pipes
import { BaseChartDirective } from 'ng2-charts'; // Directive for chart rendering
import { ChartData, ChartOptions } from 'chart.js'; // Chart.js types for data and options

@Component({
  selector: 'app-graph',
  imports: [BaseChartDirective, CommonModule], // Import necessary modules for standalone component
  standalone: true,
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css'
})
export class GraphComponent implements OnInit {
  // Input property to receive an array of price history data points from parent component
  @Input() historique: {
    new_price_diff_amount: number;  // Difference amount for new price (not used here but present)
    used_price_diff_amount: number; // Difference amount for used price (not used here but present)
    date: string;                   // Date of the price record
    new_price_old: number;          // Old/new price value at that date
    used_price_old: number;         // Old/used price value at that date
  }[] = [];

  // Input to detect if component runs in a browser environment (not used in this code but accepted)
  @Input() isBrowser: boolean | undefined;

  // Input for current (accurate) new and used price to append to graph
  @Input() Accurate: {new_price: number; used_price: number} = {
    new_price: 0,
    used_price: 0
  };

  // Array to hold the processed chart data for rendering
  public chartData: any[] = [];

  // Array to hold the labels for the chart, typically dates
  public chartLabels: string[] = [];

  // Angular lifecycle hook: runs once component initialized
  ngOnInit(): void {
    // If there is historical data, prepare the data for the graph
    if (this.historique) {
      this.prepareGraphData();
    }
  }

  // Prepares chart data and labels based on the historique input and current prices
  async prepareGraphData(): Promise<void> {
    // Extract labels (dates) from historique and append a label "now" for current price
    this.chartLabels = this.historique.map(point => point.date).concat("now");

    // Prepare data arrays for two lines: new price and used price history
    this.chartData = [
      {
        // Map new_price_old from history and append current new price
        data: this.historique.map(point => point.new_price_old).concat(this.Accurate?.new_price || []),
        label: 'Prix Neuf (€)',     // Label for new price line
        borderColor: 'blue',        // Line color blue
        fill: false                 // Do not fill area under this line
      },
      {
        // Map used_price_old from history and append current used price
        data: this.historique.map(point => point.used_price_old).concat(this.Accurate?.used_price || []),
        label: 'Prix Usagé (€)',    // Label for used price line
        borderColor: 'green',       // Line color green
        fill: true                  // Fill area under this line
      }
    ];
  }

  // Chart configuration options for responsiveness and plugins
  public lineChartOptions: any = {
    responsive: true, // Make chart responsive to container size
    plugins: {
      datalabels: {
        display: true,           // Show data labels on points
        align: 'top',            // Align labels above points
        anchor: 'end',           // Anchor labels to end of points
        color: "#2756B3",        // Color of data labels
        font: {
          family: 'FontAwesome', // Use FontAwesome font (if available)
          size: 20               // Font size for labels
        },
      },
      deferred: false            // Disable deferred rendering for immediate chart display
    },
  };

  // Custom colors for the chart line and points (currently all red)
  _lineChartColors: Array<any> = [{
    backgroundColor: 'red',
    borderColor: 'red',
    pointBackgroundColor: 'red',
    pointBorderColor: 'red',
    pointHoverBackgroundColor: 'red',
    pointHoverBorderColor: 'red'
  }];

  // Event handler triggered when user clicks on the chart (currently does nothing)
  public chartClicked(e: any): void {
    // console.log(e);
  }

  // Event handler triggered when user hovers over the chart (currently does nothing)
  public chartHovered(e: any): void {
    // console.log(e);
  }
}
