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

// Carico il prompt da file
const promptPath = path.resolve("controllers/prompt.txt"); // Percorso del file del promp
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

// Funzione per anallizzare la trascrizione del parlato --> JSON
export async function analizzaTrascrizione(req, res) {
    const  { testo } = req.body; // Parte di trascriqzione da analizzare
    if(!testo){
        return res.status(400).json({ error: "Testo mancante" }); 
    }

    try {
        // Richiesta al modello GPT per analizzare il testo
        const response = await client.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt}, // Contiene il prompt per istruire il modello
            { role: "user", content: testo } // Contiene la trascrizine da inviare al modello
        ],
        max_completion_tokens: 1000, // Numero massimo di token
        temperature: 0 // Nessuna creatività
    });
        const risposta = response.choices[0]?.message?.content?.trim(); // Estrae il contenuto testuale della risposta

        // Restituisce il risultato come JSON al client
        res.json({ risultato: risposta });
        console.log("Risposta GPT:", risposta);
    } catch (err) {
    console.error("Errore durante l'invio a GPT:", err);
    res.status(500).json({ error: "Errore durante l'elaborazione GPT", details: err.tostring() });
  }
}


