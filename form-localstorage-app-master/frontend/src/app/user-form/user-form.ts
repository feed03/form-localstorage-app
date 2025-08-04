// Import componenti Angular
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Import servizi
import { Paziente } from './paziente';
import { ChangeDetectorRef } from '@angular/core';
import { AudioRecorder } from '../audio/audioRecorder';

// Import del servizio HTTP per l'invio al backend
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})

export class UserForm implements OnInit {
  paziente: Paziente = new Paziente();
  numeroCasuale: number | null = null;

  recorder!: AudioRecorder; // Oggetto per la gestione dell'audio
  audioUrl: string | null = null; // URL generato per ascoltare l'audio generato

  isRecording: boolean = false; // tiene traccia se stiamo registrando

  trascrizione: string = " ";

  constructor(
    //private cd: ChangeDetectorRef, // Forzare gli aggiornamenti nel template
    private http: HttpClient // Invio dei blobs al BE
  ) {
    this.carica();
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
}