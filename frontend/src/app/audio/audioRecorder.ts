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

  // Costruttore riceve la callback per gestire i blob audio
  constructor(onDataCallback: (blob: Blob) => void) {
    this.onDataCallback = onDataCallback;
  }

  async start() {

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Richiesta di attivazione microfono
    this.mediaRecorder = new MediaRecorder(this.stream); // Creo un nuovo oggetto MediaRecorder che registra il flusso
    
    this.chunks = [];
    this.allChunks = [];

    // Funzione chiamata ogni volta che un nuovo frame di audio è disponibile
    this.mediaRecorder.ondataavailable = (e) => {
      
      console.log('Data available', e.data);

      this.chunks.push(e.data);
      this.allChunks.push(e.data);
    
    };

    // Avvio della registrazione
    this.mediaRecorder.start();

    // Setup per analizzare il silenzio
    this.audioContext = new AudioContext(); // Serve per analizzare il volume dell'audio in realtime

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

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount); // Array per contenere i dati audio

    this.silenceStart = null; // Reset del timer di inizio silenzio
    this.isMonitoring = true; // Setto il flag per avviare la registrazione
    this.monitorSilence(); // Avvio monitoraggio continuo dell'audio
  }

  private async monitorSilence() {
    
    // Controlli
    if (!this.isMonitoring || !this.analyser || !this.dataArray){
      return;
    }

    // Leggo i dati audio in tempo reale
    const buf = new Uint8Array(this.analyser.frequencyBinCount); // Buff temporaneo per evitare errori di tipi
    this.analyser.getByteTimeDomainData(buf);
    
    this.dataArray = buf;

    // Calcolo RMS (root mean square) per stimare il volume attuale
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const val = this.dataArray[i] - 128; // Centro a zero
      sum += val * val;
    }
    const rms = Math.sqrt(sum / this.dataArray.length); // Calcolo del volume

    try{
      if (rms < this.silenceThreshold) {
      // Silenzio
      if (this.silenceStart === null) {
        this.silenceStart = Date.now(); // Segno l'inizio del silenzio
      } else if (Date.now() - this.silenceStart > this.maxSilenceTime) {
        // Se il silenzio dura più di maxSilenceTime => pausa rilevata
        if (this.chunks.length >= 0) {
          // Aspetto blob completo da mediaRecorder
          const blob = await this.getCurrentBlob();
          
          await this.printWebMHeader(blob);

          this.mediaRecorder.stop();
          // Invio il blob tramite callback
          this.onDataCallback(blob);

          this.mediaRecorder.start();
          // Resetto i chunk parziali per iniziare a raccogliere il prossimo frammento
          console.log('RESETTO CHUNKS', rms);
          this.chunks = []; 
        }

        // Resetto il timer silenzio per rilevare la prossima pausa
        this.silenceStart = null;
      }
    } else {
      // Se il volume è sopra soglia, resetto il timer silenzio
      this.silenceStart = null;
    }
    }catch(error){
      console.error('Errore nel monitoraggio audio:', error);
      return;
    }

    // Continuo a monitorare silenzio usando requestAnimationFrame
    requestAnimationFrame(() => this.monitorSilence());
  }

  stop(): Blob {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.requestData();
        this.mediaRecorder.stop();
    }

    if(this.stream){
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    this.isMonitoring = false; // Flag per stoppare il monitorService

    // Chiudi l'AudioContext per liberare risorse
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  
    return new Blob(this.allChunks, { type: 'audio/webm' });
  }

  private async printWebMHeader(blob: Blob): Promise<void> {
  const reader = new FileReader();
  reader.onloadend = () => {
    const bytes = new Uint8Array(reader.result as ArrayBuffer);
    // Prendi i primi 4 byte e convertili in esadecimale
    const headerHex = Array.from(bytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log('WebM header bytes:', headerHex);
  };
  reader.readAsArrayBuffer(blob.slice(0, 4));
}// Metodo nuovo per ottenere blob completo da mediaRecorder
private getCurrentBlob(): Promise<Blob> {
  return new Promise((resolve) => {
    const handler = (e: BlobEvent) => {
      this.mediaRecorder.removeEventListener('dataavailable', handler);
      resolve(e.data);
    };
    this.mediaRecorder.addEventListener('dataavailable', handler);
    this.mediaRecorder.requestData();
  });

}

}