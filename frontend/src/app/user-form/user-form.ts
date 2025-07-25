import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Paziente } from './paziente';
import { NumberService } from '../number.service';
import { ChangeDetectorRef } from '@angular/core';


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

  isRecording = false; // Indica se la registrazione è attiva
  mediaRecorder!: MediaRecorder; //Oggetto per la gestione della registrazione
  chunks: Blob[] = []; // Array per contenere blocchi della registrazione 
  audioUrl: string | null = null; // URL dell'audio 

  //Prova per ascoltare l'audio
  audioElement!: HTMLAudioElement;

  constructor(private numberService: NumberService, private cd: ChangeDetectorRef) {
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

    // Metodo per avviare la registrazione audio
  async startRecording() {
    this.audioUrl = null;     // Resetta l'audio precedente
    this.chunks = [];         // Pulisce i vecchi dati

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Richiede l'accesso al microfono
      this.mediaRecorder = new MediaRecorder(stream); // Crea un MediaRecorder con lo stream audio

      // Quando arrivano dati audio, li aggiungiamo all'array chunks
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      // Quando la registrazione finisce, crea il blob audio e genera un URL per il player
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(blob);
        this.cd.detectChanges(); //Forza l'aggiornamento   
      };

      // Avvia la registrazione
      this.mediaRecorder.start(2000); // Un blob ogni 2sec
      this.isRecording = true;
    } catch (err) {
      // In caso di errore (es. microfono bloccato o negato)
      console.error('Microfono non disponibile:', err);
    }
  }

  // Metodo per stoppare la registrazione
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  /*playAudio() {
    if (this.audioUrl) {
      if (!this.audioElement) {
        this.audioElement = new Audio(this.audioUrl);
      }
      this.audioElement.play();
    }
  }*/
}
