export type Gender = "M" | "F" | "";

export interface Malattie {
  cardiopatia: boolean;
  pacemaker: boolean;
  ipertensione: boolean;
  ipotensione: boolean;
  svenimenti: boolean;
  emorragie: boolean;
  reumatismi: boolean;
  diabete: boolean;
  tiroide: boolean;
  malattie_organi_interni: boolean;
  malattie_stomaco: boolean;
  malattie_respiratorie: boolean;
  epilessia: boolean;
  osteoporosi: boolean;
  altre_malattie: string;
}

export interface Allergie {
  antibiotici: boolean;
  anestetici_locali: boolean;
  lattice: boolean;
  altre_allergie: string;
}

export interface Infezioni {
  epatite: boolean;
  tubercolosi: boolean;
  hiv: boolean;
  altre_infezioni: string;
}

export interface StatoGravidanza {
  si: boolean;
  settimane: number | null;
}

export interface Farmaci {
  marcumar: boolean;
  ass: boolean;
  anticoagulanti: boolean;
  bisfosfonati: boolean;
  anticoagulanti_orali: boolean;
  reazioni_farmaci: boolean;
  altri_farmaci: string;
}

export interface Altro {
  fumatore: boolean;
  piu_10_sigarette: boolean;
  meno_10_sigarette: boolean;
}

export class Paziente {
  // Dati anagrafici
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

  // Anamnesi
  malattie: Malattie;
  allergie: Allergie;
  infezioni: Infezioni;
  stato_gravidanza: StatoGravidanza;
  farmaci: Farmaci;
  altro: Altro;

  constructor(
    nome: string = '',
    cognome: string = '',
    birthDate?: Date,
    gender: Gender = '',
    cityOfBirth: string = '',
    address: string = '',
    houseNumber: string = '',
    zipCode: string = '',
    city: string = '',
    email: string = '',
    phone: string = ''
  ) {
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

    // Inizializzazione anamnesi
    this.malattie = {
      cardiopatia: false,
      pacemaker: false,
      ipertensione: false,
      ipotensione: false,
      svenimenti: false,
      emorragie: false,
      reumatismi: false,
      diabete: false,
      tiroide: false,
      malattie_organi_interni: false,
      malattie_stomaco: false,
      malattie_respiratorie: false,
      epilessia: false,
      osteoporosi: false,
      altre_malattie: ''
    };

    this.allergie = {
      antibiotici: false,
      anestetici_locali: false,
      lattice: false,
      altre_allergie: ''
    };

    this.infezioni = {
      epatite: false,
      tubercolosi: false,
      hiv: false,
      altre_infezioni: ''
    };

    this.stato_gravidanza = {
      si: false,
      settimane: null
    };

    this.farmaci = {
      marcumar: false,
      ass: false,
      anticoagulanti: false,
      bisfosfonati: false,
      anticoagulanti_orali: false,
      reazioni_farmaci: false,
      altri_farmaci: ''
    };

    this.altro = {
      fumatore: false,
      piu_10_sigarette: false,
      meno_10_sigarette: false
    };
  }

  static fromJSON(json: string): Paziente {
    const obj = JSON.parse(json);
    const paziente = new Paziente(
      obj.name,
      obj.surname,
      obj.birthDate ? new Date(obj.birthDate) : undefined,
      obj.gender,
      obj.cityOfBirth,
      obj.address,
      obj.houseNumber,
      obj.zipCode,
      obj.city,
      obj.email,
      obj.phone
    );

    paziente.malattie = obj.malattie;
    paziente.allergie = obj.allergie;
    paziente.infezioni = obj.infezioni;
    paziente.stato_gravidanza = obj.stato_gravidanza;
    paziente.farmaci = obj.farmaci;
    paziente.altro = obj.altro;

    return paziente;
  }
}
