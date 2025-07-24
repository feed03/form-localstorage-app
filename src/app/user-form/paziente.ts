export type Gender = "M" | "F"| ""

export class Paziente {
    name: string;
    surname: string;
    birthDate: Date;
    gender: Gender;
    cityOfBirth: string;
    address: string;
    houseNumber: number;
    zipCode: number;
    city: string;

    constructor(
        nome: string = '',
        cognome: string = '',
        birthDate: Date = new Date(),
        gender: Gender = "",
        cityOfBirth: string = '',
        address: string = '',
        houseNumber: number = 0,
        zipCode: number = 0,
        city: string = '' ){
        
        this.name = nome;
        this.surname = cognome;
        this.birthDate = birthDate;
        this.gender = gender;
        this.cityOfBirth = cityOfBirth;
        this.address = address;
        this.houseNumber = houseNumber;
        this.zipCode = zipCode;
        this.city = city;

    }
    
    //Trasformazione in string per salvataggio in memoria
    toJSON(): string {
        return JSON.stringify({
            nome: this.name,
            cognome: this.surname,
            birthDate: this.birthDate.toISOString(),
            gender: this.gender,
            cityOfBirth: this.cityOfBirth,
            address: this.address,
            houseNumber: this.houseNumber,
            zipCode: this.zipCode,
            city: this.city
        });
    }

    static fromJSON(json: string): Paziente {
        const obj = JSON.parse(json);
        return new Paziente(
            obj.nome,
            obj.cognome,
            new Date(obj.birthDate),
            obj.gender as Gender,
            obj.cityOfBirth,
            obj.address,
            obj.houseNumber,
            obj.zipCode,
            obj.city
        );
    }
}