export class Paziente {
    nome: string;
    cognome: string;


    constructor(nome: string = '', cognome: string = ''){
        this.nome = nome;
        this.cognome = cognome;
    }
    
    //Trasformazione in string per salvataggio in memoria
    toJSON(): string {
        return JSON.stringify({ nome: this.nome, cognome: this.cognome});
    }

    static fromJSON(json: string): Paziente {
        const obj = JSON.parse(json); // Converte la stringa in un oggetto
        return new Paziente(obj.nome, obj.cognome); // Crea una nuova istanza della classe Paziente
    }
}  //Prova se salva