import { Component, signal } from '@angular/core';
import { UserForm } from './user-form/user-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserForm],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('form-localstorage-app');
}
