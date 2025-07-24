import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Paziente } from './paziente';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})

export class UserForm {
  paziente = new Paziente();

  constructor() {
    this.carica();
  }

  // Converte in una stringa e salva in localStorage
  salva() {
    localStorage.setItem ('paziente', this.paziente.toJSON());
    alert('Dati salvati correttamente!');
  }

  //Carica la stringa dalla localStorage e la converte in oggetto
  carica() {
    const saved = localStorage.getItem('paziente');
    if (saved) {
      this.paziente = Paziente.fromJSON(saved);
    }
  }
}
