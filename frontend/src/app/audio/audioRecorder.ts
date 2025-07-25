// audio-recorder.ts
import { HttpClient } from '@angular/common/http';

export class AudioRecorder {
  private mediaRecorder!: MediaRecorder; // Oggetto per la gestione della traccia audio
  private chunks: Blob[] = []; // Array dove verranno accumulati i "pezzi" dell' audio
  private stream!: MediaStream; // Flusso audio dal microfono 
  private onDataCallback: (blob: Blob) => void;  // Funzione chiamata ad ogni frammento

  private timeslice = 2000;

  // Costruttore riceve la callback per gestire i blob audio
  constructor(onDataCallback: (blob: Blob) => void) {
    this.onDataCallback = onDataCallback;
  }

  async start() {

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Richiesta di attivazione microfono
    this.mediaRecorder = new MediaRecorder(this.stream); // Creo un nuovo oggetto MediaRecorder che registra il flusso
    
    this.chunks = [];

    // Funzione chiamata ogni volta che un nuovo frame di audio è disponibile
    this.mediaRecorder.ondataavailable = (e) => {
      const blob = new Blob([e.data], { type: 'audio/webm' });
      this.onDataCallback(blob);
      this.chunks.push(e.data);
    };

    this.mediaRecorder.start(this.timeslice); // Avvio la registrazione con il proprio timeslice
  }

  stop(): Blob {
    this.mediaRecorder.stop();
    this.stream.getTracks().forEach(track => track.stop());
    return new Blob(this.chunks, { type: 'audio/webm' });
  }
}
