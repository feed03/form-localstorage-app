export class AudioRecorder {
  private mediaRecorder!: MediaRecorder; // Oggetto per la gestione della traccia audio
  
  private chunks: Blob[] = []; // Array dove verranno accumulati i "pezzi" dell' audio
  private allChunks: Blob[] = [];

  private stream!: MediaStream; // Flusso audio dal microfono 
  private onDataCallback: (blob: Blob) => void;  // Funzione chiamata ad ogni frammento

  // Usati per monitorare il silenzio
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;

  private dataArray!: Uint8Array;
  private silenceStart: number | null = null; // Timestamp inizio silenzio

  private silenceThreshold = 10; // Soglia per considerare silenzio (Volume)

  private maxSilenceTime = 3000; // Durata in ms del silenzio per considerare pausa

  private isMonitoring = false; // Controllo sul monitorSilence

  // Costruttore riceve la callback per invio dei blob audio al BE
  constructor(onDataCallback: (blob: Blob) => void) {
    this.onDataCallback = onDataCallback;
  }

  async startRec() {

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Richiesta accesso al mic 
    } catch (err) {
      console.error('Accesso al microfono negato o fallito:', err);
      return;
    }
    this.mediaRecorder = new MediaRecorder(this.stream); // Creo un nuovo oggetto MediaRecorder che registra il flusso

    // Funzione chiamata ogni volta che un nuovo frame di audio è disponibile
    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data); // Chunks temporaneo
      this.allChunks.push(e.data); // Chunks cumulativo per tutta la registrazione
    };

    this.mediaRecorder.start(); // Avvio della registrazione

    this.audioContext = new AudioContext(); // Oggetto AudioContext per analizzare il silenzio

    // Assicurati che l'AudioContext sia attivo
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

    const source = this.audioContext.createMediaStreamSource(this.stream); 

    // Configurazione analyser 
    this.analyser = this.audioContext.createAnalyser(); // Nodo analyser per ottenere dati in tempo reale
    this.analyser.fftSize = 256; // Dimensione della FFT risoluzione analisi frequenza
    this.analyser.smoothingTimeConstant = 0.3; // Smoothing dei dati 
    
    source.connect(this.analyser); // Connetto il mic all' analyser per lettura in tempo reale

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount); // Intesità del segnale audio (da 0 a 255)

    this.silenceStart = null; // Reset del timer di inizio silenzio
    this.isMonitoring = true; // Setto il flag per avviare la registrazione
    this.monitorSilence(); // Avvio monitoraggio continuo dell'audio
  }

  private async monitorSilence() {
    
    // Controlli per fermare l'esecuzione
    if (!this.isMonitoring || !this.analyser || !this.dataArray){
      return;
    }

    // Leggo i dati audio in tempo reale
    const buf = new Uint8Array(this.analyser.frequencyBinCount); // Buff temporaneo per evitare errori di tipi
    this.analyser.getByteTimeDomainData(buf);
    this.dataArray = buf; // Copia nel buff originale

    const rms = this.computeRMS(this.dataArray); // Calcolo del volume

    try{
      if (rms < this.silenceThreshold) {
      // Silenzio
        if (this.silenceStart === null) {
          this.silenceStart = Date.now(); // Segno l'inizio del silenzio
        } else if (Date.now() - this.silenceStart > this.maxSilenceTime) {
          // Se il silenzio dura più di maxSilenceTime => pausa rilevata
          this.mediaRecorder.requestData(); // Richiesta dei dati registrati fin ora, evento ondataavailable
          if (this.chunks.length > 0) {
            const blob = this.createBlob(this.chunks); // Creo il blob da inviare al BE
            this.mediaRecorder.stop();
            
            if (blob.size > 0) {
              this.onDataCallback(blob); // Invio il blob al BE tramite callback
            }

            this.mediaRecorder.start();
            this.chunks = []; 
          }
          this.silenceStart = null; // Reset timer
        }
      } else {
        this.silenceStart = null;
      }
    }catch(error){
      console.error('Errore nel monitoraggio audio:', error);
      return;
    }
    requestAnimationFrame(() => this.monitorSilence());  // Continuo a monitorare
  }

  stopRec(): Blob {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.requestData();
      const blob = this.createBlob(this.chunks);
      this.mediaRecorder.stop(); // Stop manuale della registrazione
      this.onDataCallback(blob);
    }

    if(this.stream){
      this.stream.getTracks().forEach(track => track.stop()); // Interrompe tutte le tracce audio
    }
    
    this.isMonitoring = false; // Flag per stoppare il monitorService

    // Chiudi l'AudioContext per liberare risorse
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close(); // Chiude il contesto 
    }
    
    const finalBlob = this.createBlob(this.allChunks); // Creazione blob finale

    console.log('Audio finale: ', finalBlob);

    return finalBlob;
  }

  createBlob(chunk: Blob []): Blob{
    return new Blob(chunk, { type: 'audio/webm;codecs=opus' });
  }

  // Calcolo RMS (volume)
  private computeRMS(data: Uint8Array): number {
    const sum = data.reduce((acc, val) => acc + Math.pow(val - 128, 2), 0);
    return Math.sqrt(sum / data.length);
  }
}