import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY; // Recupera la chiave API da .env
const AZURE_OPENAI_API_END_POINT = process.env.AZURE_OPENAI_API_END_POINT; // Recupera l'endPoint da .env

// Configurazione del servizio
const client = new AzureOpenAI({
    apiKey: AZURE_OPENAI_API_KEY,         
    endpoint: AZURE_OPENAI_API_END_POINT,
    deployment: "gpt-4.1-mini", // Nome del deployment configurato su Azure
    apiVersion: "2024-04-01-preview", // Versione dell'API compatibile con il deployment
});

// Constants
const PROMPT_PATHS = {
    ANAGRAFICA: "prompt/promptAnagrafica.txt",
    ANAMNESI: "prompt/promptAnamnesi.txt"
};

// Azioni e contesti
const ACTIONS = { COMPILA: "compila", ANNULLA: "annulla" };
const CONTEXTS = { ANAGRAFICA: "anagrafica", ANAMNESI: "anamnesi" };


// Carico i due prompt anagrafica e anamnesi
const promptAnagrafica = fs.readFileSync(path.resolve(PROMPT_PATHS.ANAGRAFICA), "utf-8");
const promptAnamnesi = fs.readFileSync(path.resolve(PROMPT_PATHS.ANAMNESI), "utf-8");
let systemPrompt = promptAnagrafica;

// Inizializzo lo storico delle frasi e il JSON di backup per il comando annulla 
let storico = [];
let JSONBackup;

// Creazione messaggio per il modello
function buildMessages(testo) {
    return [
        { role: "system", content: systemPrompt },
        { 
            role: "user", 
            content: `
                Storico della conversazione:
                ${storico}

                Trascrizione per compilazione form:
                ${testo}`.trim()
        }
    ];
}

// Cambio prompt in base al contesto
function updateSystemPrompt(context) {
  if (context === CONTEXTS.ANAMNESI) {
    systemPrompt = promptAnamnesi;
  } else if (context === CONTEXTS.ANAGRAFICA) {
    systemPrompt = promptAnagrafica;
  }
}

// Gestisce l'eleborazione del testo ricevuto
export async function elaboraTrascrizione(testo) {
    if(!testo){
        throw new Error("Testo mancante"); 
    }

    // Costruisco il messaggio da inviare al modello
    const messages = buildMessages(testo);
    
    console.log("Testo da analizzare: ", testo);
    console.log("Storico: ", storico);

    try {
        // Chiamata al modello 
        const response = await client.chat.completions.create({
            messages,
            max_tokens: 1000,
            temperature: 0
        });
       
        // Estrae la risposta del modello
        const risposta = response.choices[0]?.message?.content?.trim();
        if (!risposta) {
            throw new Error("Nessuna risposta dal modello GPT");
        }

        // Parsed del JSON, per accesso ai campi
        let parsed = JSON.parse(risposta);      
        updateSystemPrompt(parsed.context);

        console.log("---------------------------------------------");
        console.log("Risposta GPT:", risposta);
        console.log("---------------------------------------------");

        // Case compila, in cui c'è qualche campo da aggiornare
        if (parsed.action === ACTIONS.COMPILA && "phrase" in parsed) {
            JSONBackup = parsed;
            storico.push(parsed.phrase);
            return { risultato: risposta };
        }

        // Case annulla, risprino al JSON precendente
        if (parsed.action === ACTIONS.ANNULLA) {
            if (JSONBackup) {
                const annullaJSON = { ...JSONBackup, action: ACTIONS.ANNULLA }; // Recupero il JSON di backup
                storico.pop();
                return { risultato: JSON.stringify(annullaJSON) };
            }
        }

        // Default: ritorno direttamente la risposta GPT
        return { risultato: risposta };
        
    } catch (err) {
        console.error("Errore durante l'invio a GPT:", err);
        throw new Error("Errore durante l'elaborazione GPT: " + err.toString());
    }
}