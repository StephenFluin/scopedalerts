import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './components/navigation';
import { Footer } from './components/footer';
import { ToastContainer } from './components/toast-container';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styles: `
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .main-content {
      flex: 1;
      padding-top: 16px;
    }
  `,
  imports: [RouterOutlet, Navigation, Footer, ToastContainer],
})
export class App {
  protected skipToContent(event: Event): void {
    // A plain #fragment link would resolve against <base href> and leave the page
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  }
}
