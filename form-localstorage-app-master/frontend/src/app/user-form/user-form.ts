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
  trascrizioneSintetica: string = " ";

  check_annulla: boolean = false;
  first: boolean = true;

  constructor(private http: HttpClient) {
    this.carica(); // Carica eventuali dati in cache
  }

  // Metodo per l'invio del blob audio
  ngOnInit() {
    this.recorder = new AudioRecorder((blob) => { // Inizializza il recorder audio quando il componente viene caricato
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');

      //Invio tramite POST al backend
      this.http.post<any>('http://localhost:3000/upload-audio', formData).subscribe({
        next: (res) => {
          // Salva il testo trascritto se disponibile
          if (res && res.transcriptionJob && res.transcriptionJob.DisplayText) {
            const testo_Ricevuto = res.transcriptionJob.DisplayText;
             
            if (testo_Ricevuto.toLowerCase().includes('annulla')) {
              this.check_annulla = true; // Rilevamento del comando annulla
            }

            this.trascrizione += ' \n ' + res.transcriptionJob.DisplayText; // Aggiorno trascrizione completa per visualizzazione a video
            this.trascrizioneSintetica += res.transcriptionJob.DisplayText; // Aggiorno trascrizione sintetica da inviare al modello

            console.log('TRASCRIZIONE: ', this.trascrizione);
            if(this.first){
              this.inviaTrascrizione(this.trascrizione); // Prima volta invio la trascrizione completa 
              this.first = false;
            } else {
              this.inviaTrascrizione(this.trascrizioneSintetica); // Dalla seconda invio la trascrizione sintetica
            }
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
            this.paziente.name = dati.name || '';
            this.paziente.surname = dati.surname || '';
            this.paziente.birthDate = dati.birthDate || '';
            this.paziente.cityOfBirth = dati.cityOfBirth || '';
            this.paziente.gender = dati.gender || '';
            this.paziente.address = dati.address || '';
            this.paziente.houseNumber = dati.houseNumber || '';
            this.paziente.city = dati.city || '';
            this.paziente.zipCode = dati.zipCode || '';
            this.paziente.email = dati.email || '';
            this.paziente.phone = dati.phone || '';
            
            if(this.check_annulla){
              console.log("Element to reset: ", dati.updates[dati.updates.length-1]);
              console.log("Elements before reset: ", dati.updates);
              
              const temp = dati.updates[dati.updates.length-1] as keyof Paziente;
              this.resetCampo(this.paziente, temp);
              this.check_annulla = false; // Reset della variabile di controllo
            }

            this.trascrizioneSintetica = dati.trascrizioneSintetica;
            console.log('Riassunto: ', this.trascrizioneSintetica);

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

  // Metodo per scaricare la traccia audio completa
  downloadAudio() {
    if (!this.audioUrl) return;

    const link = document.createElement('a');
    link.href = this.audioUrl;
    link.download = 'registrazione.wav';
    link.click();
  }

  // Metodo per l'effettivo reset dei Campi
  resetCampo(p: Paziente, campo: keyof Paziente) {
    switch (campo) {
      case "birthDate":
        p.birthDate = undefined;
        break;
      case "gender":
        p.gender = "";
        break;
      default:
        (p[campo] as string) = ""; // Tutti gli altri campi sono string
        break;
    }
  }
}