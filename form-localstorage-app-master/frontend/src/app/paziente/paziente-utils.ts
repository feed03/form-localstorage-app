import { Paziente, StatoGravidanza } from './paziente';

// Reset specifico dei campi Anagrafica
export function resetCampiAnagrafica(paziente: Paziente, reset: Partial<Paziente>): Paziente {
  for (const key in reset) {
    const campo = key as keyof Paziente;
    switch (campo) {
      case "birthDate":
        paziente.birthDate = undefined;
      break;
      
      case "gender":
        paziente.gender = "";
      break;
      
      default:
            (paziente[campo] as string) = "";
      break;
    }
  }
  return paziente;
}

// Reset specifico dei campi Anamnesi
export function resetCampiAnamnesi(paziente: Paziente, reset: Partial<Paziente>): Paziente {
    // Sezioni possibili da aggiornare
    const sections: (keyof Paziente)[] = ["malattie", "allergie", "infezioni", "stato_gravidanza", "farmaci", "altro"];

    for (const section of sections) {
        if (!reset[section]) continue; // In caso di sezione non presente
        const subObj = reset[section] as Record<string, any>;
        
        // Eitera sui campi della sezione
        for (const key in subObj) { 
            const value = subObj[key];

            // Case booleano
            if (typeof value === "boolean" && value) {
            (paziente[section] as any)[key] = false;
            
            // Case stringa non vuota  
            } else if (typeof value === "string" && value.trim() !== "") {
            (paziente[section] as any)[key] = "";
            
            // Case settimane di gravidanza (int)
            } else if (section === "stato_gravidanza" && key === "settimane" && typeof value === "string") {
            (paziente.stato_gravidanza as StatoGravidanza).settimane = "";
            }
        }
    }
    return paziente;

}

// Riempie i campi anagrafici
export function fillAnagrafica(paziente: Paziente, aggiornamenti: Partial<Paziente>): Paziente {
  for (const key in aggiornamenti) {
    const value = aggiornamenti[key as keyof Paziente];
    if (value == null) continue;

    const campo = key as keyof Paziente;
    switch (campo) {
      case "birthDate":
        paziente.birthDate = aggiornamenti.birthDate;
      break;
      
      case "gender":
        if (aggiornamenti.gender === "M" || aggiornamenti.gender === "F" || aggiornamenti.gender === "") {
          paziente.gender = aggiornamenti.gender;
        }
      break;
      
      default:
        (paziente[campo] as string) = value as string;
      break;
    }
  }
  return paziente;
}

// Riempie i campi anamnestici
export function fillAnamnesi(paziente: Paziente, aggiornamenti: Partial<Paziente>): Paziente {
  // Sezioni possibili da aggiornare
  const sections: (keyof Paziente)[] = ["malattie", "allergie", "infezioni", "stato_gravidanza", "farmaci", "altro"];

  for (const section of sections) {
    if (!aggiornamenti[section]) continue; // Sezione non presente, salta 
    const subObj = aggiornamenti[section] as Record<string, any>;
    
    // Eitera sui campi della sezione
    for (const key in subObj) { 
      const value = subObj[key];

      // Case booleano
      if (typeof value === "boolean" && value) {
      (paziente[section] as any)[key] = true;
      
      // Case stringa non vuota  
      } else if (typeof value === "string" && value.trim() !== "") {
      (paziente[section] as any)[key] = value;
      
      // Case settimane di gravidanza (int)
      } else if (section === "stato_gravidanza" && key === "settimane" && typeof value === "string") {
      (paziente.stato_gravidanza as StatoGravidanza).settimane = value;
      }
    }
  }
  return paziente;
}
