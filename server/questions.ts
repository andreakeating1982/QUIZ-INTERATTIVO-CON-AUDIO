/**
 * Shared Bécquer questions - used by both db.ts and routers.ts
 */
export type BecquerQuestion = {
  number: number;
  sectionTitle?: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export const BECQUER_QUESTIONS: BecquerQuestion[] = [
  {
    number: 1,
    sectionTitle: "EL AUTOR",
    question: "\u00bfD\u00f3nde naci\u00f3 Gustavo Adolfo B\u00e9cquer?",
    options: ["En Veruela", "En Madrid", "En Toledo", "En Sevilla"],
    correctAnswer: "En Sevilla",
  },
  {
    number: 2,
    sectionTitle: "EL AUTOR",
    question: "\u00bfQu\u00e9 empleo obtuvo B\u00e9cquer en 1866 que le proporcion\u00f3 estabilidad econ\u00f3mica?",
    options: ["Periodista en un diario madrile\u00f1o", "Ministro de la Gobernaci\u00f3n", "Censor oficial de novelas", "Pintor de la corte"],
    correctAnswer: "Censor oficial de novelas",
  },
  {
    number: 3,
    sectionTitle: "LA QUINTAESENCIA DEL ESCRITOR ROMANTICO",
    question: "\u00bfPor qu\u00e9 se considera a B\u00e9cquer un rom\u00e1ntico tard\u00edo?",
    options: ["Porque empez\u00f3 su trayectoria cuando ya se consolidaba el realismo-naturalismo", "Porque sus obras se publicaron varios a\u00f1os despu\u00e9s de su muerte", "Porque escribi\u00f3 sus obras m\u00e1s importantes al final de su vida", "Porque fue el \u00faltimo poeta rom\u00e1ntico espa\u00f1ol en publicar"],
    correctAnswer: "Porque empez\u00f3 su trayectoria cuando ya se consolidaba el realismo-naturalismo",
  },
  {
    number: 4,
    sectionTitle: "LA QUINTAESENCIA DEL ESCRITOR ROMANTICO",
    question: "\u00bfCu\u00e1les son las dos producciones m\u00e1s destacadas de B\u00e9cquer?",
    options: ["La Historia de los templos y El caudillo de las manos rojas", "Los art\u00edculos period\u00edsticos y las Cartas desde mi celda", "Las Cartas literarias y las obras teatrales", "Las Rimas y las Leyendas"],
    correctAnswer: "Las Rimas y las Leyendas",
  },
  {
    number: 5,
    sectionTitle: "RIMAS (DESDE 1858)",
    question: "\u00bfQu\u00e9 ocurri\u00f3 con el manuscrito original de las RIMAS que B\u00e9cquer entreg\u00f3 a Gonz\u00e1lez Bravo en 1867?",
    options: ["Se perdi\u00f3 durante el saqueo del palacio del ministro en la revoluci\u00f3n de 1868", "Fue destruido accidentalmente por el propio B\u00e9cquer", "B\u00e9cquer lo perdi\u00f3 durante un viaje a Toledo", "Se public\u00f3 \u00edntegramente en vida del autor"],
    correctAnswer: "Se perdi\u00f3 durante el saqueo del palacio del ministro en la revoluci\u00f3n de 1868",
  },
  {
    number: 6,
    sectionTitle: "3.1. ESTRUCTURA",
    question: "\u00bfEn cu\u00e1ntos bloques tem\u00e1ticos se dividen las 79 poes\u00edas de las Rimas?",
    options: ["En cuatro bloques", "En tres bloques", "En dos bloques", "En un bloque"],
    correctAnswer: "En cuatro bloques",
  },
  {
    number: 7,
    sectionTitle: "3.1. ESTRUCTURA",
    question: "\u00bfCu\u00e1l es el tema central del primer bloque (Rimas I-XI)?",
    options: ["La reflexi\u00f3n sobre la poes\u00eda y la inspiraci\u00f3n po\u00e9tica", "La exaltaci\u00f3n amorosa y la belleza femenina", "El desenga\u00f1o y la melancol\u00eda", "La muerte y la angustia vital"],
    correctAnswer: "La reflexi\u00f3n sobre la poes\u00eda y la inspiraci\u00f3n po\u00e9tica",
  },
  {
    number: 8,
    sectionTitle: "3.2. LENGUAJE Y ESTILO",
    question: "\u00bfCu\u00e1l es el metro preferido de B\u00e9cquer en sus RIMAS?",
    options: ["La mezcla de endecas\u00edlabos con heptas\u00edlabos", "Los versos de 10 s\u00edlabas de tradici\u00f3n culta", "El octos\u00edlabo de tradici\u00f3n popular", "Los versos de 12 s\u00edlabas"],
    correctAnswer: "La mezcla de endecas\u00edlabos con heptas\u00edlabos",
  },
  {
    number: 9,
    sectionTitle: "3.2. LENGUAJE Y ESTILO",
    question: "\u00bfEn qu\u00e9 tradici\u00f3n po\u00e9tica se inspir\u00f3 B\u00e9cquer para su estilo?",
    options: ["En la poes\u00eda italiana del Renacimiento", "En la poes\u00eda alemana contempor\u00e1nea", "En la poes\u00eda francesa contempor\u00e1nea", "En la poes\u00eda \u00e1rabe andalus\u00ed"],
    correctAnswer: "En la poes\u00eda alemana contempor\u00e1nea",
  },
  {
    number: 10,
    sectionTitle: "3.2. LENGUAJE Y ESTILO",
    question: "\u00bfC\u00f3mo describi\u00f3 D\u00e1maso Alonso el verso becqueriano?",
    options: ["Quebrado, hasta tr\u00e9mulo", "Rotundo y grandioso", "Grave y solemne", "\u00c1gil y vibrante"],
    correctAnswer: "Quebrado, hasta tr\u00e9mulo",
  },
];
