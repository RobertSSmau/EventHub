import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationsContainerComponent } from './shared/components/notifications-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationsContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('eventhub-frontend');
}
