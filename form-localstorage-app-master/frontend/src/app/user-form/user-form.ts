import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Import servizi
import { Paziente } from './paziente';
import { AudioRecorder } from '../audio/audioRecorder';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatToolbarModule } from '@angular/material/toolbar';


@Component({
  selector: 'app-user-form',
  standalone: true, 
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
    MatSelectModule, MatOptionModule,
    MatDatepickerModule, MatDividerModule,
    FormsModule, MatToolbarModule
  ],
    
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css']
})

export class UserForm implements OnInit {
  paziente: Paziente = new Paziente();

  recorder!: AudioRecorder; // Oggetto per la gestione dell'audio
  audioUrl: string | null = null; // URL generato per ascoltare l'audio generato
  isRecording: boolean = false; // tiene traccia se stiamo registrando

  trascrizione: string = " ";
  trascrizioneProva: string = "";

  constructor(private http: HttpClient) {
    this.carica();
    this.caricaTrascrizioneDaFile('testoProva_4.txt');
  }

  ngOnInit() {
    this.recorder = new AudioRecorder((blob) => { // Inizializza il recorder audio quando il componente viene caricato
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');

      //Invio tramite POST al backend
      this.http.post<any>('http://localhost:3000/upload-audio', formData).subscribe({
        next: (res) => {
          console.log('FE --> Blob inviato', 'BE -->', res);
          // Salva il testo trascritto se disponibile
          if (res && res.transcriptionJob && res.transcriptionJob.DisplayText) {
            this.trascrizione += ' \n ' + res.transcriptionJob.DisplayText;
            console.log('TRASCRIZIONE: ', this.trascrizione);
            this.inviaTrascrizione(this.trascrizione);
          }
        },
        error: (err) => {
          console.error('Errore invio:', err);
        }
      });
    });
  }

  // Salva localmente i dati (cache del browser)
  salva() {
    localStorage.setItem('paziente', this.paziente.toJSON()); 
    alert('Dati salvati correttamente!');
  }
  
  // Carica dalla cache i dati
  carica() {
    const saved = localStorage.getItem('paziente');
    if (saved) {
      this.paziente = Paziente.fromJSON(saved);
    }
  }
  
  // Cancella i dati dalla cache
  reset() {
    this.paziente = new Paziente();
    localStorage.removeItem('paziente');
    alert('Dati resettati!');
  }
  
  // Inzia la registrazione
  async startRecording() {
    await this.recorder.startRec();
    this.isRecording = true;
  }

  // Stoppa la registrazione
  stopRecording() {
  this.isRecording = false;

    setTimeout(() => {
      const finalBlob = this.recorder.stopRec(); // Il blob completo di tutta la registrazione

      this.audioUrl = URL.createObjectURL(finalBlob);
      console.log('URL audio:', this.audioUrl);
      //this.cd.detectChanges();
    }, 300); // ritardo minimo per aspettare l’ultimo chunk
  }

  // Metodo che invia la trascriizone la BackEnd e popola il form
  inviaTrascrizione(testo: string) {
    if (!testo.trim()) {
      alert("La trascrizione è vuota.");
      return;
    }
    this.http.post<any>('http://localhost:3000/analizza', { testo }).subscribe({
      next: (res) => {
        if (res?.risultato) {
          try {
            const dati = JSON.parse(res.risultato);
            this.paziente.name = dati.nome || '';
            this.paziente.surname = dati.cognome || '';
            this.paziente.birthDate = dati.data_nascita || '';
            this.paziente.cityOfBirth = dati.luogo_nascita || '';
            this.paziente.gender = dati.genere || '';
            this.paziente.address = dati.indirizzo || '';
            this.paziente.houseNumber = dati.numero_civico || '';
            this.paziente.city = dati.citta_residenza || '';
            this.paziente.zipCode = dati.cap || '';
            this.paziente.email = dati.email || '';
            this.paziente.phone = dati.telefono || '';
          } catch {
            alert("Formato risposta non valido");
          }
        } else {
          alert('Nessun risultato dal modello');
        }
      },
      error: (err) => console.error("Errore durante invio al modello:", err)
    });
  }

  caricaTrascrizioneDaFile(percorso: string) {
    this.http.get(percorso, { responseType: 'text' }).subscribe({
      next: testo => this.trascrizioneProva = testo,
      error: err => console.error('Errore caricamento file:', err)
    });
  }
}