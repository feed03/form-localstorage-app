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

// Carico i due prompt
const promptAnagrafica = fs.readFileSync(path.resolve("controllers/promptAnagrafica.txt"), "utf-8");
const promptAnamnesi = fs.readFileSync(path.resolve("controllers/promptAnamnesi.txt"), "utf-8");
let systemPrompt = promptAnagrafica; // Inizio con prompt anagrafica

// Invio della trascrizone al modello, restituisce al client il risultato aggiornato
export async function analizzaTrascrizione(req, res) {
    const testo = req.body.testo; // Trascrizione da inviare al modello, ricevuta dal FE
    if(!testo){
        return res.status(400).json({ error: "Testo mancante" }); 
    }

    try {
        // Chiamata al modello 
        const response = await client.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt}, // Contiene il prompt per istruire il modello
            { role: "user", content: testo } // Contiene la trascrizine da inviare al modello
        ],
        max_completion_tokens: 1000, // Numero massimo di token
        temperature: 0 // Nessuna creatività
    });
        const risposta = response.choices[0]?.message?.content?.trim(); // Estrae il contenuto testuale della risposta
        console.log("---------------------------------------------");

        let parsed = JSON.parse(risposta);

        systemPrompt = parsed.action === "anamnesi" ? promptAnamnesi : promptAnagrafica; // Cambio del prompt in base al campo action

        console.log("Testo da inviare", testo);
        console.log("Risposta GPT:", risposta);
        console.log("Time: ", Date.now());
        console.log("---------------------------------------------");

        res.json({ risultato: risposta }); // Ritorna al FE il risultato ottenuto dal modello
    } catch (err) {
    console.error("Errore durante l'invio a GPT:", err);
    res.status(500).json({ error: "Errore durante l'elaborazione GPT", details: err.toString() });
  }
}


