import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const apiKey = process.env.AZURE_OPENAI_API_KEY; // Recupera la chiave API da .env
const endpoint = process.env.AZURE_OPENAI_API_END_POINT; // Recupera l'endPoint da .env

// Configurazione del servizio
const client = new AzureOpenAI({
    apiKey, // Key della risorsa OPENAPI
    endpoint, // Endpoint della risorsa Azure
    deployment: "gpt-4.1-mini", // Nome del deployment configurato su Azure
    apiVersion: "2024-04-01-preview", // Versione dell'API compatibile con il deployment
});

// Carico i due prompt anagrafica e anamnesi
const promptAnagrafica = fs.readFileSync(path.resolve("controllers/promptAnagrafica.txt"), "utf-8");
const promptAnamnesi = fs.readFileSync(path.resolve("controllers/promptAnamnesi.txt"), "utf-8");
let systemPrompt = promptAnagrafica;

// Inizializzo lo storico delle frasi e il JSON di backup per il comando annulla 
let storico = [];
let JSONBackup;

// Invio della trascrizone al modello
export async function analizzaTrascrizione(req, res) {
    const testo = req.body.testo; // Ultimo pezzo di trascrizione ricevuto dal FE
    
    if(!testo){
        return res.status(400).json({ error: "Testo mancante" }); 
    }

    // Costruisco il messaggio da inviare al modello
    const messages = [
        { role: "system", content: systemPrompt },
        // Aggiungo l'ultima frase come ultimo messaggio e lo storico
        { role: "user", content: `
            Storico della conversazione:
            ${storico}

            Trascrizione per compilazione form:
            ${testo}` 
        }
    ];
    
    console.log("Testo da analizzare: ", testo);
    console.log("Storico: ", storico);

    try {
        // Chiamata al modello 
        const response = await client.chat.completions.create({
            messages,
            max_tokens: 1000,
            temperature: 0
        });
       
        const risposta = response.choices[0]?.message?.content?.trim(); // Estrae il contenuto testuale della risposta
        let parsed = JSON.parse(risposta); // Parsed del JSON, per accesso ai campi        
        systemPrompt = parsed.context === "anamnesi" ? promptAnamnesi : promptAnagrafica; // Cambio del prompt in base al campo action

        if("action" in parsed){
            if(parsed.action === "compila" &&  "phrase" in parsed){ // Case nel quale ci sono dei campi da aggiornare
                JSONBackup = parsed; // Salvo il JSON per poterlo ripristinare in caso di ANNULLA
                storico.push(parsed.phrase); // Aggiorno lo storico con l'ultima frase riassuntiva
                
                console.log("---------------------------------------------");
                console.log("Risposta GPT:", risposta);
                console.log("---------------------------------------------");
                
                res.json({ risultato: risposta }); // Ritorna al FE il risultato ottenuto dal modello
            } else if(parsed.action === "annulla"){
                // Caso annulla, recupero l'ultimo JSON
                if (JSONBackup) {
                    
                    const annullaJSON = { ...JSONBackup, action: "annulla" };
                    
                    console.log("---------------------------------------------");
                    console.log("Risposta GPT", risposta);
                    console.log("JSON per il FE annulla:", annullaJSON);
                    console.log("---------------------------------------------");
                    
                    storico.pop(); // Elimino l'ultimo elemento dello storico
                    res.json({ risultato: JSON.stringify(annullaJSON) });
                }
            } else  {
                console.log("---------------------------------------------");
                console.log("Risposta GPT:", risposta);
                console.log("---------------------------------------------");
                res.json({ risultato: risposta }); // Ritorna al FE il risultato ottenuto dal modello
            }
        } else{
            console.log("---------------------------------------------");
            console.log("Risposta GPT:", risposta);
            console.log("---------------------------------------------");
            res.json({ risultato: risposta }); // Ritorna al FE il risultato ottenuto dal modello
        }
    } catch (err) {
    console.error("Errore durante l'invio a GPT:", err);
    res.status(500).json({ error: "Errore durante l'elaborazione GPT", details: err.toString() });
  }
}


