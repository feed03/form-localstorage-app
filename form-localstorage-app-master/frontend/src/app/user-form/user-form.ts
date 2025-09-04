import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Import servizi
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
import { Paziente, Malattie, Allergie, Infezioni, StatoGravidanza, Farmaci, Altro } from './paziente';


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
  
   @ViewChild('trascrizioneBox') private trascrizioneBox!: ElementRef;

  context: string = "anagrafica";

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

            this.trascrizione += ' \n ' + testo_Ricevuto; // Aggiorno trascrizione completa per visualizzazione a video

            this.inviaTrascrizione(testo_Ricevuto); // Invio trascrizone al BE
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
            if(parsed.context == "anagrafica"){
              this.context = "anagrafica";
            } else if(parsed.context == "anamnesi"){
              this.context = "anamnesi"; 
            }
            
            // Rilevo se devo aggiornare o resettare i campi
            if("action" in parsed){
              if(parsed.action === "compila"){
                console.log("Elementi da aggiornare: ", parsed);

                if(parsed.context === "anagrafica"){
                  this.fillAnagrafica(parsed); // Aggiorno i campi
                } else if(parsed.context === "anamnesi"){
                  this.fillAnamnesi(parsed); // Setto a true solo i campi booleani specificati
                }                
              } else {
                console.log("Elementi da resettare: ", parsed)
                this.resetCampo(parsed); //  Ripristino i campi
              }
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
  resetCampo(reset: Partial<Paziente>) {
    for (const key in reset) {
      
      const value = reset[key as keyof Paziente];
      if (value == null) continue;
      
      const campo = key as keyof Paziente;
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
  }

  // Metodo per riempire l'anagrafica
 fillAnagrafica(aggiornamenti: Partial<Paziente>) {
  console.log("Aggiornamenti ricevuti:", aggiornamenti);
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
            console.log("Campo aggiornato:", campo, "->", aggiornamenti[campo]);
          break;
        }
    }
  }

// Metodo per settare a true solo i campi booleani specificati nell'input
fillAnamnesi(aggiornamenti: Partial<Paziente>) {
  console.log("Campi da aggiornare:", aggiornamenti);
  
  // Gestione malattie
  if (aggiornamenti.malattie) {
    for (const key in aggiornamenti.malattie) {
      const campo = key as keyof Malattie;
      const value = aggiornamenti.malattie[campo];
      if (typeof value === 'boolean' && value === true) {
        (this.paziente.malattie as any)[campo] = true;
        console.log(`Campo malattie.${campo} settato a true`);
      } else if (typeof value === 'string' && value.trim() !== '') {
        (this.paziente.malattie as any)[campo] = value;
        console.log(`Campo malattie.${campo} settato a "${value}"`);
      }
    }
  }
  
  // Gestione allergie
  if (aggiornamenti.allergie) {
    for (const key in aggiornamenti.allergie) {
      const campo = key as keyof Allergie;
      const value = aggiornamenti.allergie[campo];
      if (typeof value === 'boolean' && value === true) {
        (this.paziente.allergie as any)[campo] = true;
        console.log(`Campo allergie.${campo} settato a true`);
      } else if (typeof value === 'string' && value.trim() !== '') {
        (this.paziente.allergie as any)[campo] = value;
        console.log(`Campo allergie.${campo} settato a "${value}"`);
      }
    }
  }
  
  // Gestione infezioni
  if (aggiornamenti.infezioni) {
    for (const key in aggiornamenti.infezioni) {
      const campo = key as keyof Infezioni;
      const value = aggiornamenti.infezioni[campo];
      if (typeof value === 'boolean' && value === true) {
        (this.paziente.infezioni as any)[campo] = true;
        console.log(`Campo infezioni.${campo} settato a true`);
      } else if (typeof value === 'string' && value.trim() !== '') {
        (this.paziente.infezioni as any)[campo] = value;
        console.log(`Campo infezioni.${campo} settato a "${value}"`);
      }
    }
  }
  
  // Gestione stato gravidanza
  if (aggiornamenti.stato_gravidanza) {
    for (const key in aggiornamenti.stato_gravidanza) {
      const campo = key as keyof StatoGravidanza;
      const value = aggiornamenti.stato_gravidanza[campo];
      
      if (typeof value === 'boolean' && value === true) {
        // Per stato_gravidanza, se settiamo uno a true, gli altri devono essere false
        if (campo === 'sconosciuto' || campo === 'no' || campo === 'si') {
          this.paziente.stato_gravidanza.sconosciuto = false;
          this.paziente.stato_gravidanza.no = false;
          this.paziente.stato_gravidanza.si = false;
          (this.paziente.stato_gravidanza as any)[campo] = true;
          console.log(`Campo stato_gravidanza.${campo} settato a true (altri settati a false)`);
        }
      }
      // Gestione settimane (campo numerico)
      if (campo === 'settimane' && typeof value === 'number') {
        this.paziente.stato_gravidanza.settimane = value;
        console.log(`Campo stato_gravidanza.settimane settato a ${value}`);
      }
    }
  }
  
  // Gestione farmaci
  if (aggiornamenti.farmaci) {
    for (const key in aggiornamenti.farmaci) {
      const campo = key as keyof Farmaci;
      const value = aggiornamenti.farmaci[campo];
      if (typeof value === 'boolean' && value === true) {
        (this.paziente.farmaci as any)[campo] = true;
        console.log(`Campo farmaci.${campo} settato a true`);
      } else if (typeof value === 'string' && value.trim() !== '') {
        (this.paziente.farmaci as any)[campo] = value;
        console.log(`Campo farmaci.${campo} settato a "${value}"`);
      }
    }
  }
  
  // Gestione altro (abitudini)
  if (aggiornamenti.altro) {
    for (const key in aggiornamenti.altro) {
      const campo = key as keyof Altro;
      const value = aggiornamenti.altro[campo];
      if (typeof value === 'boolean' && value === true) {
        // Per fumatore, gestiamo la logica mutualmente esclusiva
        if (campo === 'fumatore') {
          this.paziente.altro.fumatore = true;
          console.log(`Campo altro.fumatore settato a true`);
        } else if (campo === 'piu_10_sigarette' || campo === 'meno_10_sigarette') {
          // Se specifichiamo il numero di sigarette, il paziente è automaticamente fumatore
          this.paziente.altro.fumatore = true;
          this.paziente.altro.piu_10_sigarette = false;
          this.paziente.altro.meno_10_sigarette = false;
          (this.paziente.altro as any)[campo] = true;
          console.log(`Campo altro.${campo} settato a true (fumatore automaticamente true)`);
        }
      }
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

  // Aggiorno lo stato di gravidanza a No se il genere e maschile
  onGenderChange() {
    if (this.paziente.gender === 'M') {
      this.paziente.stato_gravidanza = { sconosciuto: false, no: true, si: false, settimane: null };
    } 
  }
}