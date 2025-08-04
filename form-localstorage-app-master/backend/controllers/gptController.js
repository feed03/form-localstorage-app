import { AzureOpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.AZURE_OPENAI_API_KEY; // Recupera la chiave API da .env

// Configurazione del servizio
const client = new AzureOpenAI({
    apiKey,
    endpoint: "https://federico-unipi-openai-resource.cognitiveservices.azure.com/", // Endpoint della risorsa Azure
    deployment: "gpt-4.1-mini", // Nome del deployment configurato su Azure
    apiVersion: "2024-04-01-preview", // Versione dell'API compatibile con il deployment
});

// Funzione per anallizzare la trascrizione del parlato --> JSON
export async function analizzaTrascrizione(req, res) {
    const { testo } = req.body;
    console.log('Testo ricevuto: ', testo);
    if(!testo){
        return res.status(400).json({ error: "Testo mancante" });
    }

    try {
        // Richiesta al modello GPT per analizzare il testo
        const response = await client.chat.completions.create({
        messages: [
            {
                role: "system",
                content:
                    "Estrai i dati anagrafici e anamnestici da una visita tra dentista e paziente. Restituisci un JSON con le chiavi: nome, cognome, data_nascita, luogo_nascita, patologie, farmaci, allergie, abitudini, sintomi_attuali."
            },
            { role: "user", content: testo }
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
    res.status(500).json({ error: "Errore durante l'analisi del testo" });
  }
}


