import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Paziente } from './paziente';
import { NumberService } from '../number.service'; // <== IMPORTA IL SERVIZIO


@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})

export class UserForm {
  paziente = new Paziente();
  numeroCasuale: number | null = null; 

  constructor(private numberService: NumberService) {
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

  //Resetta i dati del salvataggio
  reset() {
  this.paziente = new Paziente();
  localStorage.removeItem('paziente');
  alert('Dati resettati!');
  }

  //Metodo per ottenere il numero dal backend
  generaNumero() {
    this.numberService.getRandomNumber().subscribe(risposta => {
      this.numeroCasuale = risposta.numero;
    });
  }
}
