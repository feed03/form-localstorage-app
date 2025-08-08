export type Gender = "M" | "F"| ""

export class Paziente {
    name: string;
    surname: string;
    birthDate?: Date;
    gender: Gender;
    cityOfBirth: string;
    address: string;
    houseNumber: string;
    zipCode: string;
    city: string;
    email: string;
    phone: string;

    constructor(
        nome: string = '',
        cognome: string = '',
        birthDate?: Date,
        gender: Gender = '',
        cityOfBirth: string = '',
        address: string = '',
        houseNumber: string = '',
        zipCode: string = '',
        city: string = '' ,
        email: string = '',
        phone: string = ''){
        
        this.name = nome;
        this.surname = cognome;
        this.birthDate = birthDate ? new Date(birthDate) : undefined;
        this.gender = gender;
        this.cityOfBirth = cityOfBirth;
        this.address = address;
        this.houseNumber = houseNumber;
        this.zipCode = zipCode;
        this.city = city;
        this.email = email;
        this.phone = phone;
    }
    
    //Trasformazione in string per salvataggio in memoria
    toJSON(): string {
        return JSON.stringify({
            nome: this.name,
            cognome: this.surname,
            birthDate: this.birthDate,
            gender: this.gender,
            cityOfBirth: this.cityOfBirth,
            address: this.address,
            houseNumber: this.houseNumber,
            zipCode: this.zipCode,
            city: this.city,
            email: this.email,
            phone: this.phone
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
            obj.city,
            obj.email,
            obj.phone
        );
    }
}