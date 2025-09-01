import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { timestamp } from 'rxjs';


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
    FormsModule, MatToolbarModule,
    MatCheckboxModule, MatRadioModule
  ],
    
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css']
})

export class UserForm implements OnInit {

  paziente: Paziente = new Paziente();

  recorder!: AudioRecorder; // Oggetto per la gestione dell'audio
  audioUrl: string | null = null; // URL generato per ascoltare l'audio generato
  isRecording: boolean = false; // tiene traccia se stiamo registrando

  trascrizione: string = " "; // Trascrizione completo per visualizzazione nella textArea
  trascrizioneSintetica: string = " "; // Trascrizione aggiornata a runTime per inviare al modello
  update: string = " ";
  
   @ViewChild('trascrizioneBox') private trascrizioneBox!: ElementRef;

  action: string = "anagrafica";

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
    
      // Controllo se il formData ha effettivamente dei file
      if (blob.size <= 12800) {
        return; // Non fare la chiamata se non c'è audio
      }
      //Invio tramite POST al backend
      this.http.post<any>('http://localhost:3000/upload-audio', formData).subscribe({
        next: (res) => {
          // Salva il testo trascritto se disponibile
          if (res && res.transcriptionJob && res.transcriptionJob.DisplayText) {
            const testo_Ricevuto = res.transcriptionJob.DisplayText; // Ultima parte di trascrizione ricevuto
             
            if (testo_Ricevuto.toLowerCase().includes('annulla')) {
              console.log("Annulla rilevato");
              this.check_annulla = true; // Rilevamento del comando annulla
            }

            this.trascrizione += ' \n ' + testo_Ricevuto; // Aggiorno trascrizione completa per visualizzazione a video

            if(this.first){
              this.inviaTrascrizione(this.trascrizione); // Prima volta invio la trascrizione completa 
              this.first = false;
            } else {
                this.trascrizioneSintetica += testo_Ricevuto; // Aggiungi
                this.inviaTrascrizione(this.trascrizioneSintetica); // Invio della trascrizione la BE
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
    localStorage.setItem('paziente', JSON.stringify(this.paziente)); 
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
    this.http.post<any>('http://localhost:3000/analizza', { testo }).subscribe({ // Chiamata per inviare la trascrizione al BE
      next: (res) => {
        if (res?.risultato) {
          try {
            const parsed = JSON.parse(res.risultato);

            // Cambio contesto per spostare il focus nell'interfaccia
            if(parsed.action == "anagrafica"){
              this.action = "anagrafica";
            } else if(parsed.action == "anamnesi"){
              this.action = "anamnesi"; 
            }
          
            this.fillAnagraficaAnamnesi(parsed); // Metodo che popola sia l'anagrafica che l'anamnesi
            if(parsed.trascrizioneSintetica != ""){
              console.log(parsed);
              this.trascrizioneSintetica = parsed.trascrizioneSintetica; // Aggiorno trascrizione
              this.update = parsed.updates[parsed.updates.length - 1]; // Salvo l'ultimo elemento modificato
              console.log(this.update);
            }
            
            // Sistema
            if(this.check_annulla){
              console.log("Annulla rilevato, resetto campo: ", this.update);
              this.resetCampo(this.update as keyof Paziente);
              this.check_annulla = false;
            } else {
              this.update = parsed.updates[parsed.updates.length - 1]; // Salvo l'ultimo elemento modificato
              console.log("Ultimo campo", this.update);
            }
           
          } catch (err) {
            alert("Formato risposta non valido" + err);
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
  resetCampo(campo: keyof Paziente) {
    switch (campo) {
      case "birthDate":
        this.paziente.birthDate = undefined;
        break;
      case "gender":
        this.paziente.gender = "";
        break;
      default:
        (this.paziente[campo] as string) = ""; // Tutti gli altri campi sono string
        console.log("Campo annullato");
        break;
    }
  }

  // Metodo per riempire l'anagrafica
 fillAnagraficaAnamnesi(aggiornamenti: Partial<Paziente>) {
    for (const key in aggiornamenti) {
      const value = aggiornamenti[key as keyof Paziente];
      if (value == null) continue;
        const campo = key as keyof Paziente;
        
          switch (campo) {
          case "birthDate":
            this.paziente.birthDate = aggiornamenti.birthDate;
          break;
          
          case "gender":
            if (aggiornamenti.gender !== undefined) { // Controllo sul valore
              const g = aggiornamenti.gender;
              if (g === "M" || g === "F" || g === "") {
                this.paziente.gender = g;
              }
            }
          break;
          
          default:
            (this.paziente[campo] as string) = (aggiornamenti[campo] as string); // Tutti gli altri campi sono string/boolean
          break;
        }
    }
  }

  // Metodi per lo scroll della textArea
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const element = this.trascrizioneBox.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  // Aggiorno lo stato di gravidanza se 
  onGenderChange() {
    if (this.paziente.gender === 'M') {
      this.paziente.stato_gravidanza = { sconosciuto: false, no: true, si: false, settimane: null };
    } 
  }
}