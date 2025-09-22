export class AudioRecorder {
  private mediaRecorder!: MediaRecorder; // Gestione traccia audio
  
  private chunks: Blob[] = [];
  private allChunks: Blob[] = [];

  private stream!: MediaStream; // Flusso audio dal microfono 
  private onDataCallback: (blob: Blob) => void; // Callback per invio dei blob al BE

  // Usati per monitorare il silenzio
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;

  private dataArray!: Uint8Array;
  private silenceStart: number | null = null;

  private silenceThreshold = 10; // Soglia per considerare silenzio (Volume)
  private maxSilenceTime = 750; // Durata in ms del silenzio per considerare pausa
  private isMonitoring = false; // Controllo sul monitorSilence

  // Costruttore riceve la callback per invio dei blob audio al BE
  constructor(onDataCallback: (blob: Blob) => void) {
    this.onDataCallback = onDataCallback;
  }

  async startRec() {

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Accesso al mic 
    } catch (err) {
      console.error('Accesso al microfono negato o fallito:', err);
      return;
    }

    // Oggetto per gestire la registrazione
    this.mediaRecorder = new MediaRecorder(this.stream, { 
        mimeType: 'audio/webm;codecs=opus'
    });

    // Funzione chiamata ogni volta che un nuovo frame di audio è disponibile
    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data);
      this.allChunks.push(e.data);
    };

    this.mediaRecorder.start();
    this.audioContext = new AudioContext();

    // Controllo sull'audio Context 
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

    const source = this.audioContext.createMediaStreamSource(this.stream); 

    // Configurazione analyser 
    this.analyser = this.audioContext.createAnalyser(); // Nodo analyser per ottenere dati in tempo reale
    this.analyser.fftSize = 256; // Dimensione della FFT risoluzione analisi frequenza
    this.analyser.smoothingTimeConstant = 0.3;
    
    source.connect(this.analyser); // Connetto il mic all' analyser per lettura in tempo reale
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount); // Intesità del segnale audio (da 0 a 255)

    this.silenceStart = null; 
    this.isMonitoring = true;
    this.monitorSilence();
  }

  private async monitorSilence() {
    
    // Controlli per stoppare l'esecuzione
    if (!this.isMonitoring || !this.analyser || !this.dataArray){
      return;
    }

    // Leggo i dati audio in tempo reale
    const buf = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buf);
    this.dataArray = buf;

    // Calcolo del volume
    const rms = this.computeRMS(this.dataArray);

    try{
      if (rms < this.silenceThreshold) {
      // Silenzio
        if (this.silenceStart === null) {
          // Segno l'inizio del silenzio
          this.silenceStart = Date.now();
        } else if (Date.now() - this.silenceStart > this.maxSilenceTime) {
          // Richiesta dei dati registrati fin ora
          this.mediaRecorder.requestData();
          
          if (this.chunks.length > 0) {
            const blob = this.createBlob(this.chunks); // Creo il blob da inviare al BE
            this.mediaRecorder.stop();
            
            if (blob.size > 0) {
              this.onDataCallback(blob); // Invio il blob al BE tramite callback
            }

            this.mediaRecorder.start();
            this.chunks = []; 
          }
          this.silenceStart = null;
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
    // Invio al BE l'ultima parte di audio
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.requestData();
      const blob = this.createBlob(this.chunks);
      this.mediaRecorder.stop(); // Stop manuale della registrazione
      this.onDataCallback(blob);
    }

    if(this.stream){
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    this.isMonitoring = false;

    // Chiudi l'AudioContext per liberare risorse
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close(); // Chiude il contesto 
    }
    
    const finalBlob = this.createBlob(this.allChunks); // Creazione blob finale
    return finalBlob;
  }

  // Creazione Blob da inviare al BE
  createBlob(chunk: Blob []): Blob{
    return new Blob(chunk, { type: 'audio/webm' });
  }

  // Calcolo RMS (volume)
  private computeRMS(data: Uint8Array): number {
    const sum = data.reduce((acc, val) => acc + Math.pow(val - 128, 2), 0);
    return Math.sqrt(sum / data.length);
  }
}