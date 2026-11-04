// Directorio curado de ciudades para descubrimiento y SEO programático.
//
// Por qué curado y no las 150k ciudades de `country-state-city`: los slugs de
// Casas Cripto salen de nombres en español escritos por usuarios
// ("ciudad-de-mexico"), mientras que las bases mundiales usan nombres en
// inglés ("mexico-city") — importarlas tal cual crearía URLs duplicadas y
// miles de páginas vacías (doorways), que Google penaliza en dominios nuevos
// en vez de indexar. Estas ciudades usan slugs ya compatibles con el formato
// del sitio; las vacías existen con FAQs + CTA en `noindex` y entran al
// índice y al sitemap solas en cuanto se publica su primer listado.
//
// .mjs puro para testearse con `node --test` (ver propertyUrls.mjs).
export const popularCities = [
  // México — donde ya hay tracción
  {
    city: "Ciudad de México",
    citySlug: "ciudad-de-mexico",
    state: "Ciudad de México",
    stateSlug: "ciudad-de-mexico",
    country: "México",
  },
  {
    city: "Guadalajara",
    citySlug: "guadalajara",
    state: "Jalisco",
    stateSlug: "jalisco",
    country: "México",
  },
  {
    city: "Monterrey",
    citySlug: "monterrey",
    state: "Nuevo León",
    stateSlug: "nuevo-leon",
    country: "México",
  },
  {
    city: "Puebla",
    citySlug: "puebla",
    state: "Puebla",
    stateSlug: "puebla",
    country: "México",
  },
  {
    city: "Querétaro",
    citySlug: "queretaro",
    state: "Querétaro",
    stateSlug: "queretaro",
    country: "México",
  },
  {
    city: "Mérida",
    citySlug: "merida",
    state: "Yucatán",
    stateSlug: "yucatan",
    country: "México",
  },
  {
    city: "Cancún",
    citySlug: "cancun",
    state: "Quintana Roo",
    stateSlug: "quintana-roo",
    country: "México",
  },
  {
    city: "Tulum",
    citySlug: "tulum",
    state: "Quintana Roo",
    stateSlug: "quintana-roo",
    country: "México",
  },
  {
    city: "Playa del Carmen",
    citySlug: "playa-del-carmen",
    state: "Quintana Roo",
    stateSlug: "quintana-roo",
    country: "México",
  },
  {
    city: "Tijuana",
    citySlug: "tijuana",
    state: "Baja California",
    stateSlug: "baja-california",
    country: "México",
  },
  {
    city: "Los Cabos",
    citySlug: "los-cabos",
    state: "Baja California Sur",
    stateSlug: "baja-california-sur",
    country: "México",
  },
  {
    city: "La Paz",
    citySlug: "la-paz",
    state: "Baja California Sur",
    stateSlug: "baja-california-sur",
    country: "México",
  },
  {
    city: "Puerto Vallarta",
    citySlug: "puerto-vallarta",
    state: "Jalisco",
    stateSlug: "jalisco",
    country: "México",
  },
  {
    city: "León",
    citySlug: "leon",
    state: "Guanajuato",
    stateSlug: "guanajuato",
    country: "México",
  },
  {
    city: "San Miguel de Allende",
    citySlug: "san-miguel-de-allende",
    state: "Guanajuato",
    stateSlug: "guanajuato",
    country: "México",
  },
  {
    city: "Morelia",
    citySlug: "morelia",
    state: "Michoacán",
    stateSlug: "michoacan",
    country: "México",
  },
  {
    city: "Oaxaca",
    citySlug: "oaxaca",
    state: "Oaxaca",
    stateSlug: "oaxaca",
    country: "México",
  },
  {
    city: "Chihuahua",
    citySlug: "chihuahua",
    state: "Chihuahua",
    stateSlug: "chihuahua",
    country: "México",
  },
  {
    city: "Delicias",
    citySlug: "delicias",
    state: "Chihuahua",
    stateSlug: "chihuahua",
    country: "México",
  },
  {
    city: "Hermosillo",
    citySlug: "hermosillo",
    state: "Sonora",
    stateSlug: "sonora",
    country: "México",
  },
  {
    city: "Culiacán",
    citySlug: "culiacan",
    state: "Sinaloa",
    stateSlug: "sinaloa",
    country: "México",
  },
  {
    city: "Toluca",
    citySlug: "toluca",
    state: "Estado de México",
    stateSlug: "estado-de-mexico",
    country: "México",
  },
  {
    city: "San Luis Potosí",
    citySlug: "san-luis-potosi",
    state: "San Luis Potosí",
    stateSlug: "san-luis-potosi",
    country: "México",
  },
  {
    city: "Aguascalientes",
    citySlug: "aguascalientes",
    state: "Aguascalientes",
    stateSlug: "aguascalientes",
    country: "México",
  },
  // Latam + EE.UU./España — expansión natural del comprador cripto
  {
    city: "Miami",
    citySlug: "miami",
    state: "Florida",
    stateSlug: "florida",
    country: "Estados Unidos",
  },
  {
    city: "Madrid",
    citySlug: "madrid",
    state: "Comunidad de Madrid",
    stateSlug: "comunidad-de-madrid",
    country: "España",
  },
  {
    city: "Bogotá",
    citySlug: "bogota",
    state: "Cundinamarca",
    stateSlug: "cundinamarca",
    country: "Colombia",
  },
  {
    city: "Medellín",
    citySlug: "medellin",
    state: "Antioquia",
    stateSlug: "antioquia",
    country: "Colombia",
  },
  {
    city: "Buenos Aires",
    citySlug: "buenos-aires",
    state: "Buenos Aires",
    stateSlug: "buenos-aires",
    country: "Argentina",
  },
  {
    city: "Santiago",
    citySlug: "santiago",
    state: "Santiago",
    stateSlug: "santiago",
    country: "Chile",
  },
  // México, segunda oleada: frontera, Bajío, sureste y capitales
  {
    city: "Ciudad Juárez",
    citySlug: "ciudad-juarez",
    state: "Chihuahua",
    stateSlug: "chihuahua",
    country: "México",
  },
  {
    city: "Zapopan",
    citySlug: "zapopan",
    state: "Jalisco",
    stateSlug: "jalisco",
    country: "México",
  },
  {
    city: "Mexicali",
    citySlug: "mexicali",
    state: "Baja California",
    stateSlug: "baja-california",
    country: "México",
  },
  {
    city: "Ensenada",
    citySlug: "ensenada",
    state: "Baja California",
    stateSlug: "baja-california",
    country: "México",
  },
  {
    city: "Campeche",
    citySlug: "campeche",
    state: "Campeche",
    stateSlug: "campeche",
    country: "México",
  },
  {
    city: "Tuxtla Gutiérrez",
    citySlug: "tuxtla-gutierrez",
    state: "Chiapas",
    stateSlug: "chiapas",
    country: "México",
  },
  {
    city: "San Cristóbal de las Casas",
    citySlug: "san-cristobal-de-las-casas",
    state: "Chiapas",
    stateSlug: "chiapas",
    country: "México",
  },
  {
    city: "Saltillo",
    citySlug: "saltillo",
    state: "Coahuila",
    stateSlug: "coahuila",
    country: "México",
  },
  {
    city: "Torreón",
    citySlug: "torreon",
    state: "Coahuila",
    stateSlug: "coahuila",
    country: "México",
  },
  {
    city: "Durango",
    citySlug: "durango",
    state: "Durango",
    stateSlug: "durango",
    country: "México",
  },
  {
    city: "Pachuca",
    citySlug: "pachuca",
    state: "Hidalgo",
    stateSlug: "hidalgo",
    country: "México",
  },
  {
    city: "Mazatlán",
    citySlug: "mazatlan",
    state: "Sinaloa",
    stateSlug: "sinaloa",
    country: "México",
  },
  {
    city: "Villahermosa",
    citySlug: "villahermosa",
    state: "Tabasco",
    stateSlug: "tabasco",
    country: "México",
  },
  {
    city: "Veracruz",
    citySlug: "veracruz",
    state: "Veracruz",
    stateSlug: "veracruz",
    country: "México",
  },
  {
    city: "Xalapa",
    citySlug: "xalapa",
    state: "Veracruz",
    stateSlug: "veracruz",
    country: "México",
  },
  {
    city: "Zacatecas",
    citySlug: "zacatecas",
    state: "Zacatecas",
    stateSlug: "zacatecas",
    country: "México",
  },
  {
    city: "Cuernavaca",
    citySlug: "cuernavaca",
    state: "Morelos",
    stateSlug: "morelos",
    country: "México",
  },
  // Internacional, segunda oleada: EE.UU., España y Latam
  {
    city: "Orlando",
    citySlug: "orlando",
    state: "Florida",
    stateSlug: "florida",
    country: "Estados Unidos",
  },
  {
    city: "Houston",
    citySlug: "houston",
    state: "Texas",
    stateSlug: "texas",
    country: "Estados Unidos",
  },
  {
    city: "Barcelona",
    citySlug: "barcelona",
    state: "Cataluña",
    stateSlug: "cataluna",
    country: "España",
  },
  {
    city: "Valencia",
    citySlug: "valencia",
    state: "Comunidad Valenciana",
    stateSlug: "comunidad-valenciana",
    country: "España",
  },
  {
    city: "Sevilla",
    citySlug: "sevilla",
    state: "Andalucía",
    stateSlug: "andalucia",
    country: "España",
  },
  {
    city: "Cali",
    citySlug: "cali",
    state: "Valle del Cauca",
    stateSlug: "valle-del-cauca",
    country: "Colombia",
  },
  {
    city: "Cartagena",
    citySlug: "cartagena",
    state: "Bolívar",
    stateSlug: "bolivar",
    country: "Colombia",
  },
  {
    city: "Lima",
    citySlug: "lima",
    state: "Lima",
    stateSlug: "lima",
    country: "Perú",
  },
  {
    city: "São Paulo",
    citySlug: "sao-paulo",
    state: "São Paulo",
    stateSlug: "sao-paulo",
    country: "Brasil",
  },
  {
    city: "Ciudad de Panamá",
    citySlug: "ciudad-de-panama",
    state: "Panamá",
    stateSlug: "panama",
    country: "Panamá",
  },
  {
    city: "San José",
    citySlug: "san-jose",
    state: "San José",
    stateSlug: "san-jose",
    country: "Costa Rica",
  },
  {
    city: "Santo Domingo",
    citySlug: "santo-domingo",
    state: "Distrito Nacional",
    stateSlug: "distrito-nacional",
    country: "República Dominicana",
  },
];

// Ciudades curadas de un estado (para la sección "populares" de la página
// del estado y del directorio). Comparación por slug, no por nombre.
export function citiesOfState(stateSlug) {
  return popularCities.filter((c) => c.stateSlug === stateSlug);
}

// Formato de slug válido (el que genera libs/slugify): minúsculas,
// números y guiones, sin acentos ni espacios.
export function isValidSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// Registro de estados indexables: los 32 de México + estados/regiones donde
// hay ciudades populares (ver popularCities). Una página de estado/región
// SIN listados solo se indexa si está aquí (con su guía única); cualquier
// otro slug vacío devuelve 404 — así el espacio indexable es finito y cada
// URL tiene contenido editorial propio, no plantillas intercambiables.
export const stateGuides = {
  aguascalientes: {
    name: "Aguascalientes",
    country: "México",
    guide:
      "Aguascalientes combina industria fuerte y calidad de vida en el Bajío, con demanda constante de vivienda media y residencial. Publicar aquí en cripto abre la puerta a compradores foráneos que buscan precio accesible y plusvalía estable.",
  },
  "baja-california": {
    name: "Baja California",
    country: "México",
    guide:
      "Baja California vive del dinamismo fronterizo: Tijuana, Mexicali y Rosarito atraen compradores de ambos lados de la frontera. El pago en cripto encaja perfecto con operaciones binacionales sin fricción bancaria.",
  },
  "baja-california-sur": {
    name: "Baja California Sur",
    country: "México",
    guide:
      "Baja California Sur es sinónimo de Los Cabos: turismo de lujo, segundas residencias y alta demanda internacional. Es uno de los mercados donde más sentido tiene cerrar en cripto con compradores extranjeros.",
  },
  campeche: {
    name: "Campeche",
    country: "México",
    guide:
      "Campeche ofrece centro histórico patrimonio mundial y precios todavía accesibles frente a otros destinos del sureste. Ideal para inversionistas que buscan entrar temprano pagando en cripto.",
  },
  chiapas: {
    name: "Chiapas",
    country: "México",
    guide:
      "Chiapas combina ciudades coloniales como San Cristóbal con naturaleza única, atrayendo turismo alternativo y nómadas digitales. Los precios accesibles lo vuelven interesante para diversificar en cripto.",
  },
  chihuahua: {
    name: "Chihuahua",
    country: "México",
    guide:
      "Chihuahua, el estado más grande de México, mezcla industria fronteriza en Juárez con agroindustria en Delicias y la capital. Publicar en cripto conecta a propietarios locales con compradores de todo el país y Estados Unidos.",
  },
  "ciudad-de-mexico": {
    name: "Ciudad de México",
    country: "México",
    guide:
      "La Ciudad de México concentra la mayor demanda inmobiliaria del país: Roma, Condesa, Polanco y corredores emergentes. Aceptar cripto acelera cierres con compradores nacionales e internacionales sin trabas bancarias.",
  },
  coahuila: {
    name: "Coahuila",
    country: "México",
    guide:
      "Coahuila, con Saltillo y Torreón, crece al ritmo del nearshoring y la industria automotriz. La vivienda media tiene demanda sólida y el pago en cripto atrae inversión foránea.",
  },
  colima: {
    name: "Colima",
    country: "México",
    guide:
      "Colima combina el puerto de Manzanillo con una capital tranquila y precios accesibles. Un mercado pequeño donde un listado en cripto destaca de inmediato.",
  },
  durango: {
    name: "Durango",
    country: "México",
    guide:
      "Durango ofrece ciudad colonial, cercanía con el norte industrial y precios entre los más accesibles del país. Perfecto para inversionistas cripto que buscan rendimiento por renta.",
  },
  "estado-de-mexico": {
    name: "Estado de México",
    country: "México",
    guide:
      "El Estado de México rodea a la capital con corredores como Toluca, Metepec e Interlomas. Su volumen de vivienda lo hace ideal para listar en cripto y llegar a compradores de todo el Valle de México.",
  },
  guanajuato: {
    name: "Guanajuato",
    country: "México",
    guide:
      "Guanajuato mezcla la potencia industrial de León y Silao con joyas coloniales como San Miguel de Allende. Extranjeros y nacionales compiten aquí: aceptar cripto amplía tu pool de compradores.",
  },
  guerrero: {
    name: "Guerrero",
    country: "México",
    guide:
      "Guerrero, con Acapulco a la cabeza, apuesta por la reactivación turística y la segunda residencia. Los precios de oportunidad atraen a compradores cripto con visión de largo plazo.",
  },
  hidalgo: {
    name: "Hidalgo",
    country: "México",
    guide:
      "Hidalgo crece como alternativa accesible al Valle de México, con Pachuca y Tizayuca absorbiendo demanda. Publicar en cripto capta a compradores jóvenes de la capital.",
  },
  jalisco: {
    name: "Jalisco",
    country: "México",
    guide:
      "Jalisco une el hub tecnológico de Guadalajara con el turismo de Puerto Vallarta y Chapala. Es uno de los estados con más extranjeros comprando: el cierre en cripto es una ventaja real.",
  },
  michoacan: {
    name: "Michoacán",
    country: "México",
    guide:
      "Michoacán ofrece ciudades patrimonio como Morelia y Pátzcuaro, además de remesas que sostienen la demanda. Aceptar cripto facilita compras a distancia para migrantes e inversionistas.",
  },
  morelos: {
    name: "Morelos",
    country: "México",
    guide:
      "Morelos es el destino de fin de semana de la Ciudad de México: Cuernavaca y Tepoztlán concentran casas de descanso. El pago en cripto agiliza operaciones entre particulares.",
  },
  nayarit: {
    name: "Nayarit",
    country: "México",
    guide:
      "Nayarit alberga la Riviera Nayarit y Punta Mita, con algunos de los desarrollos más exclusivos del Pacífico. Compradores internacionales de alto perfil valoran cerrar en cripto.",
  },
  "nuevo-leon": {
    name: "Nuevo León",
    country: "México",
    guide:
      "Nuevo León, liderado por Monterrey, es el motor industrial del norte con la vivienda más dinámica del país. El perfil empresarial regiomontano adopta rápido el pago en cripto.",
  },
  oaxaca: {
    name: "Oaxaca",
    country: "México",
    guide:
      "Oaxaca vive un boom: la capital cultural y Puerto Escondido atraen turismo e inversión récord. Entrar ahora, incluso pagando en cripto, es posicionarse antes de que suba más.",
  },
  puebla: {
    name: "Puebla",
    country: "México",
    guide:
      "Puebla combina industria automotriz, universidades y centro histórico, con demanda estable de vivienda media. Un mercado sólido para listar en cripto.",
  },
  queretaro: {
    name: "Querétaro",
    country: "México",
    guide:
      "Querétaro es sinónimo de crecimiento: industria aeroespacial, parques industriales y alta migración interna. La plusvalía sostenida lo hace favorito de inversionistas, incluidos los de cripto.",
  },
  "quintana-roo": {
    name: "Quintana Roo",
    country: "México",
    guide:
      "Quintana Roo es la capital turística de México: Cancún, Tulum y Playa del Carmen generan rentas vacacionales top. Cobrar en cripto conecta directo con el turista-inversionista global.",
  },
  "san-luis-potosi": {
    name: "San Luis Potosí",
    country: "México",
    guide:
      "San Luis Potosí crece con el Bajío industrial y atrae turismo a la Huasteca. Precios competitivos y demanda industrial sostienen la inversión en vivienda.",
  },
  sinaloa: {
    name: "Sinaloa",
    country: "México",
    guide:
      "Sinaloa une agroindustria fuerte con el turismo de Mazatlán. La vivienda media y vacacional encuentran aquí compradores regionales y nacionales.",
  },
  sonora: {
    name: "Sonora",
    country: "México",
    guide:
      "Sonora conecta con Arizona: Hermosillo industrial y Puerto Peñasco vacacional atraen compradores binacionales. El pago en cripto simplifica operaciones transfronterizas.",
  },
  tabasco: {
    name: "Tabasco",
    country: "México",
    guide:
      "Tabasco gira en torno a Villahermosa y la industria energética, con demanda corporativa de vivienda. Un nicho interesante para rentas ejecutivas.",
  },
  tamaulipas: {
    name: "Tamaulipas",
    country: "México",
    guide:
      "Tamaulipas combina frontera activa con el puerto de Tampico y segundas residencias en playa Miramar. Mercado regional con oportunidades de precio.",
  },
  tlaxcala: {
    name: "Tlaxcala",
    country: "México",
    guide:
      "Tlaxcala, el estado más pequeño, ofrece tranquilidad colonial a minutos de Puebla y la Ciudad de México. Precios bajos y potencial de crecimiento para inversionistas pacientes.",
  },
  veracruz: {
    name: "Veracruz",
    country: "México",
    guide:
      "Veracruz mezcla el puerto comercial más importante del país con turismo de playa y café en Xalapa y Coatepec. Diversidad de mercados en un solo estado.",
  },
  yucatan: {
    name: "Yucatán",
    country: "México",
    guide:
      "Yucatán es el fenómeno del sureste: Mérida lidera en seguridad y calidad de vida, atrayendo migración nacional masiva. La plusvalía histórica premia a quien entra temprano, en pesos o en cripto.",
  },
  zacatecas: {
    name: "Zacatecas",
    country: "México",
    guide:
      "Zacatecas ofrece centro histórico patrimonio mundial y precios entre los más bajos del país. Para inversionistas cripto que buscan flujo por renta.",
  },
  florida: {
    name: "Florida",
    country: "Estados Unidos",
    guide:
      "Florida concentra la mayor comunidad latina comprando en Estados Unidos: Miami lidera en segundas residencias y pre-construcción. El puente cripto entre Latam y Miami elimina fricciones bancarias.",
  },
  "comunidad-de-madrid": {
    name: "Comunidad de Madrid",
    country: "España",
    guide:
      "Madrid es el hub inmobiliario de España con demanda internacional constante y rentabilidad sólida. Compradores latinoamericanos usan cada vez más cripto para entrar al mercado europeo.",
  },
  cundinamarca: {
    name: "Cundinamarca",
    country: "Colombia",
    guide:
      "Cundinamarca, con Bogotá como centro, es el mercado más líquido de Colombia. La adopción cripto colombiana facilita cierres entre particulares.",
  },
  antioquia: {
    name: "Antioquia",
    country: "Colombia",
    guide:
      "Antioquia vive el boom de Medellín: nómadas digitales e inversionistas extranjeros dispararon la demanda. Pagar en cripto es ya práctica común en el mercado premium paisa.",
  },
  "buenos-aires": {
    name: "Buenos Aires",
    country: "Argentina",
    guide:
      "La provincia y ciudad de Buenos Aires concentran el mercado argentino, donde el dólar cripto es moneda corriente. Publicar en cripto aquí es hablar el idioma del comprador local.",
  },
  santiago: {
    name: "Santiago",
    country: "Chile",
    guide:
      "Santiago concentra la demanda chilena con el mercado más estable del Cono Sur. Inversionistas regionales diversifican aquí, cada vez más con cripto.",
  },
  texas: {
    name: "Texas",
    country: "Estados Unidos",
    guide:
      "Texas, con Houston, Dallas y Austin, es el motor económico del sur de Estados Unidos con fuerte comunidad latina. Compradores mexicanos diversifican aquí, cada vez más con cripto.",
  },
  cataluna: {
    name: "Cataluña",
    country: "España",
    guide:
      "Cataluña, liderada por Barcelona, es el polo tecnológico y turístico del Mediterráneo español. Inversión internacional constante con rentabilidad sólida en alquiler.",
  },
  "comunidad-valenciana": {
    name: "Comunidad Valenciana",
    country: "España",
    guide:
      "La Comunidad Valenciana une Valencia capital con la Costa Blanca, destino favorito de europeos y latinoamericanos. Precios más accesibles que Madrid o Barcelona.",
  },
  andalucia: {
    name: "Andalucía",
    country: "España",
    guide:
      "Andalucía combina Sevilla, Málaga y la Costa del Sol con turismo todo el año. Fuerte demanda de segundas residencias entre extranjeros.",
  },
  "valle-del-cauca": {
    name: "Valle del Cauca",
    country: "Colombia",
    guide:
      "El Valle del Cauca, con Cali como centro, es motor industrial y cultural del suroccidente colombiano. Mercado amplio con precios competitivos frente a Bogotá y Medellín.",
  },
  bolivar: {
    name: "Bolívar",
    country: "Colombia",
    guide:
      "Bolívar alberga Cartagena de Indias, joya colonial del Caribe y destino turístico premium. El centro histórico y Bocagrande atraen inversión internacional.",
  },
  lima: {
    name: "Lima",
    country: "Perú",
    guide:
      "Lima concentra el mercado peruano: Miraflores, San Isidro y Barranco lideran la demanda. La adopción cripto peruana crece entre inversionistas jóvenes.",
  },
  "sao-paulo": {
    name: "São Paulo",
    country: "Brasil",
    guide:
      "São Paulo es el centro financiero de Brasil con el mercado más profundo de Latam. Inversores regionales diversifican aquí, cada vez más en cripto.",
  },
  panama: {
    name: "Panamá",
    country: "Panamá",
    guide:
      "Panamá, con su capital y la zona del Canal, es hub financiero y logístico de la región. Economía dolarizada que facilita operaciones con cripto.",
  },
  "san-jose": {
    name: "San José",
    country: "Costa Rica",
    guide:
      "San José concentra la demanda costarricense con estabilidad democrática y turismo consolidado. Expats y nómadas sostienen el mercado premium.",
  },
  "distrito-nacional": {
    name: "Distrito Nacional",
    country: "República Dominicana",
    guide:
      "El Distrito Nacional alberga Santo Domingo, capital con turismo, nearshoring y remesas. El mercado dominicano crece con inversión extranjera constante.",
  },
};

// Guías únicas por ciudad popular (clave "estado/ciudad"). Mismo rol que
// stateGuides: contenido editorial propio para que cada página vacía
// indexable sea una mini-guía local, no una plantilla con el nombre cambiado.
export const cityGuides = {
  "ciudad-de-mexico/ciudad-de-mexico":
    "Conquistar la Ciudad de México en cripto: Roma, Condesa, Del Valle y Narvarte lideran búsquedas de extranjeros y jóvenes profesionistas. Un listado aquí compite por la mayor audiencia del país.",
  "jalisco/guadalajara":
    "Guadalajara, la Perla Tapatía, mezcla boom tecnológico en Andares y Providencia con tradición en Chapalita. Ideal para listar departamentos que acepten cripto.",
  "nuevo-leon/monterrey":
    "Monterrey: San Pedro, Valle Oriente y Cumbres concentran la vivienda premium del norte. El comprador regio valora cierres rápidos, y la cripto los acelera.",
  "puebla/puebla":
    "Puebla capital ofrece Angelópolis y La Paz para vivienda media-alta, más centro histórico para inversión turística. Mercado estable con demanda universitaria constante.",
  "queretaro/queretaro":
    "Querétaro capital: Juriquilla, El Refugio y el Centro Histórico absorben migración récord. Publicar aquí es pescar en el mercado de mayor crecimiento del país.",
  "yucatan/merida":
    "Mérida: el norte (Altabrisa, Montecristo) y el centro histórico restaurado lideran la plusvalía del sureste. Los foráneos compran a distancia: la cripto lo facilita.",
  "quintana-roo/cancun":
    "Cancún combina vivienda local en auge con producto vacacional de alta ocupación. Rentas en dólares y pago en cripto: la fórmula del inversionista caribeño.",
  "quintana-roo/tulum":
    "Tulum es marca global: departamentos en Aldea Zama y La Veleta se venden a extranjeros que prefieren cripto. El listado aquí tiene audiencia internacional garantizada.",
  "quintana-roo/playa-del-carmen":
    "Playa del Carmen equilibra turismo masivo con comunidad expat establecida en Playacar y el centro. Fuerte demanda de rentas y reventa en cripto.",
  "baja-california/tijuana":
    "Tijuana crece vertical: Zona Río y Chapultepec reciben demanda binacional constante. Operar en cripto elimina el dolor de las transferencias transfronterizas.",
  "baja-california-sur/los-cabos":
    "Los Cabos (Cabo San Lucas y San José del Cabo) es lujo puro: villas y condos para compradores de Estados Unidos. El ticket alto y el perfil internacional gritan cripto.",
  "baja-california-sur/la-paz":
    "La Paz ofrece la bahía más bella de Baja a fracción del precio de Los Cabos. Mercado emergente ideal para entrar temprano con cripto.",
  "jalisco/puerto-vallarta":
    "Puerto Vallarta mezcla turismo consolidado con comunidad retirada norteamericana en Marina y Zona Romántica. Segundas residencias listas para pagarse en cripto.",
  "guanajuato/leon":
    "León, la capital del calzado, sostiene demanda de vivienda media con empleo industrial sólido. Flujo por renta para inversionistas pacientes.",
  "guanajuato/san-miguel-de-allende":
    "San Miguel de Allende enamora a expats de todo el mundo: el centro histórico cotiza en dólares. Vender en cripto aquí es estándar del mercado extranjero.",
  "michoacan/morelia":
    "Morelia combina patrimonio mundial con universidades y gobierno: demanda rental estable. Precios accesibles para empezar un portafolio.",
  "oaxaca/oaxaca":
    "Oaxaca capital vive su mejor momento: el centro y Jalatlaco atraen turismo premium e inversión boutique. Plusvalía cultural en ascenso.",
  "chihuahua/chihuahua":
    "Chihuahua capital: distrito norte y centro histórico con demanda minera e industrial. Mercado norteño sólido para vivienda media.",
  "chihuahua/delicias":
    "Delicias, corazón agroindustrial de Chihuahua, ofrece vivienda accesible con economía estable. Ideal para primeras inversiones en el norte.",
  "sonora/hermosillo":
    "Hermosillo crece con industria y comercio fronterizo: Pitic y el norte concentran vivienda nueva. Demanda binacional con Arizona.",
  "sinaloa/culiacan":
    "Culiacán, capital sinaloense, sostiene vivienda media-alta con agroindustria y comercio. Mercado regional profundo y estable.",
  "estado-de-mexico/toluca":
    "Toluca y Metepec absorben demanda del Valle de México a mitad de precio que la capital. Volumen y liquidez para inversionistas.",
  "san-luis-potosi/san-luis-potosi":
    "San Luis Potosí capital: Lomas y Carranza crecen con el Bajío industrial. Rentas ejecutivas con demanda corporativa.",
  "aguascalientes/aguascalientes":
    "Aguascalientes capital combina industria japonesa y alemana con la Feria de San Marcos. Vivienda media con ocupación alta.",
  "florida/miami":
    "Miami es la capital latina de Estados Unidos: Brickell, Wynwood y Edgewater se venden a compradores globales. El corredor cripto entre Latam y Miami crece cada año.",
  "comunidad-de-madrid/madrid":
    "Madrid: Salamanca, Chamberí y Malasaña atraen capital latino que diversifica en euros. La cripto como puente para comprar en Europa.",
  "cundinamarca/bogota":
    "Bogotá: Chicó, Cabrera y Usaquén lideran el segmento alto colombiano. Mercado profundo con adopción cripto creciente entre particulares.",
  "antioquia/medellin":
    "Medellín: El Poblado y Laureles son imán de nómadas e inversionistas. Rentas en dólares y cierres en cripto ya son el estándar premium.",
  "buenos-aires/buenos-aires":
    "Buenos Aires: Palermo, Recoleta y Puerto Madero cotizan en dólares cripto desde hace años. Publicar aquí en cripto es hablar el idioma local.",
  "santiago/santiago":
    "Santiago: Las Condes, Vitacura y Ñuñoa concentran la demanda chilena estable. Puerta de entrada para diversificar en el Cono Sur.",
  "chihuahua/ciudad-juarez":
    "Ciudad Juárez, la frontera más activa, sostiene demanda industrial y comercial constante. Operaciones binacionales donde la cripto elimina fricciones.",
  "jalisco/zapopan":
    "Zapopan concentra Andares y los nuevos desarrollos premium de Guadalajara. La zona de mayor plusvalía de la ciudad.",
  "baja-california/mexicali":
    "Mexicali, capital bajacaliforniana, combina agroindustria e industria con precios accesibles. Mercado fronterizo estable.",
  "baja-california/ensenada":
    "Ensenada une puerto, vino de Guadalupe y turismo californiano. Destino emergente para segundas residencias.",
  "campeche/campeche":
    "Campeche capital, patrimonio mundial, ofrece centro colonial restaurado a precios de oportunidad. Entrada temprana al sureste.",
  "chiapas/tuxtla-gutierrez":
    "Tuxtla Gutiérrez, capital chiapaneca, concentra gobierno y comercio con vivienda accesible. Base para explorar el estado.",
  "chiapas/san-cristobal-de-las-casas":
    "San Cristóbal de las Casas es imán de turismo alternativo y expats con su centro colonial. Rentas turísticas en crecimiento.",
  "coahuila/saltillo":
    "Saltillo crece con el clúster automotriz y su cercanía a Monterrey. Vivienda media con demanda industrial sólida.",
  "coahuila/torreon":
    "Torreón, corazón de La Laguna, sostiene comercio e industria con precios competitivos. Flujo por renta para inversionistas.",
  "durango/durango":
    "Durango capital ofrece centro histórico y cercanía al norte industrial. De los precios más accesibles del país.",
  "hidalgo/pachuca":
    "Pachuca absorbe demanda del Valle de México con precios todavía bajos. Crecimiento sostenido por cercanía a la capital.",
  "sinaloa/mazatlan":
    "Mazatlán vive un boom con el malecón renovado y turismo en récord. Segundas residencias con alta ocupación.",
  "tabasco/villahermosa":
    "Villahermosa concentra la industria energética con demanda ejecutiva de vivienda. Nicho de rentas corporativas.",
  "veracruz/veracruz":
    "Veracruz puerto mezcla comercio, turismo de playa y carnaval. Mercado diverso con oportunidades de precio.",
  "veracruz/xalapa":
    "Xalapa, capital cultural y universitaria, ofrece clima templado y precios bajos. Ideal para rentas estudiantiles.",
  "zacatecas/zacatecas":
    "Zacatecas capital, patrimonio mundial, cotiza entre lo más barato del país. Rendimiento por renta para presupuestos ajustados.",
  "morelos/cuernavaca":
    "Cuernavaca, la ciudad de la eterna primavera, concentra casas de descanso de capitalinos. Mercado probado de fin de semana.",
  "florida/orlando":
    "Orlando suma turismo masivo y crecimiento poblacional récord. Rentas vacacionales y vivienda media con demanda constante.",
  "texas/houston":
    "Houston, capital energética, ofrece vivienda amplia a precios razonables para Estados Unidos. Fuerte comunidad latina compradora.",
  "cataluna/barcelona":
    "Barcelona: Eixample, Gràcia y Poblenou atraen capital global. Mercado premium con liquidez internacional.",
  "comunidad-valenciana/valencia":
    "Valencia combina playa, Ciudad de las Artes y precios menores que Madrid. Favorita de nómadas e inversionistas europeos.",
  "andalucia/sevilla":
    "Sevilla, capital andaluza, une patrimonio, turismo y calidad de vida. Rentas turísticas sólidas todo el año.",
  "valle-del-cauca/cali":
    "Cali, la sucursal del cielo, ofrece salsa, clima y precios accesibles. Mercado amplio para empezar en Colombia.",
  "bolivar/cartagena":
    "Cartagena: centro amurallado y Bocagrande cotizan como el Caribe premium colombiano. Inversión turística internacional.",
  "lima/lima":
    "Lima: Miraflores y Barranco lideran para extranjeros e inversionistas. Puerta de entrada al mercado peruano.",
  "sao-paulo/sao-paulo":
    "São Paulo: Itaim Bibi, Vila Nova Conceição y Pinheiros concentran el capital brasileño. El mercado más profundo de Latam.",
  "panama/ciudad-de-panama":
    "Ciudad de Panamá: Punta Pacífica y Casco Antiguo atraen banca y expats. Economía dolarizada ideal para cripto.",
  "san-jose/san-jose":
    "San José: Escazú y Santa Ana concentran el segmento premium costarricense. Estabilidad y turismo sostienen precios.",
  "distrito-nacional/santo-domingo":
    "Santo Domingo: Piantini y la Zona Colonial mezclan negocios y turismo. Crecimiento con inversión extranjera.",
};

// ¿El slug es un estado/región del registro? Devuelve la ficha o null.
export function knownState(stateSlug) {
  return stateGuides[stateSlug] || null;
}

// ¿La pareja estado/ciudad está en el registro? Devuelve { city, state,
// country, guide } o null. La guía es la de la ciudad.
export function knownCity(stateSlug, citySlug) {
  const entry = popularCities.find(
    (c) => c.stateSlug === stateSlug && c.citySlug === citySlug,
  );
  if (!entry) return null;
  return { ...entry, guide: cityGuides[`${stateSlug}/${citySlug}`] || null };
}

// Todos los slugs de estado del registro (directorio + sitemap).
export function allStateSlugs() {
  return Object.keys(stateGuides);
}

// Ciudades top para interlinking sitewide (footer + sidebar): aparecen en
// TODAS las páginas, así que reparten PageRank interno a las URLs geo más
// importantes y aceleran su descubrimiento. Mantener corto (~12): más links
// sitewide diluyen el valor de cada uno.
const TOP_CITY_KEYS = [
  "ciudad-de-mexico/ciudad-de-mexico",
  "jalisco/guadalajara",
  "nuevo-leon/monterrey",
  "queretaro/queretaro",
  "yucatan/merida",
  "quintana-roo/cancun",
  "quintana-roo/tulum",
  "quintana-roo/playa-del-carmen",
  "jalisco/puerto-vallarta",
  "antioquia/medellin",
  "florida/miami",
  "comunidad-de-madrid/madrid",
];

export const topCities = TOP_CITY_KEYS.map((key) => {
  const [stateSlug, citySlug] = key.split("/");
  return popularCities.find(
    (c) => c.stateSlug === stateSlug && c.citySlug === citySlug,
  );
}).filter(Boolean);

// Países del registro, sin duplicados: México primero (mercado principal),
// resto alfabético. Alimenta el select de país del héroe de búsqueda.
export function allCountries() {
  const countries = new Set([
    ...popularCities.map((c) => c.country),
    ...Object.values(stateGuides).map((s) => s.country),
  ]);
  const rest = [...countries]
    .filter((c) => c !== "México")
    .sort((a, b) => a.localeCompare(b));
  return ["México", ...rest].filter((c) => countries.has(c));
}

// Guías únicas por país (clave = slug del país): contenido editorial propio
// para las páginas /propiedades/pais/*, indexables aunque estén vacías.
export const countryGuides = {
  mexico: {
    name: "México",
    guide:
      "México es el mercado principal de Casas Cripto: de la Ciudad de México al Caribe, los propietarios listan casas, departamentos y terrenos que aceptan cripto. Explora por estado o publica la tuya gratis.",
  },
  "estados-unidos": {
    name: "Estados Unidos",
    guide:
      "Estados Unidos concentra la mayor comunidad latina comprando propiedades: Miami, Houston y Orlando lideran. El puente cripto elimina fricciones bancarias entre Latam y EE. UU.",
  },
  espana: {
    name: "España",
    guide:
      "España atrae capital latino que diversifica en euros: Madrid, Barcelona y Valencia lideran. Comprar con cripto como puente es cada vez más común.",
  },
  colombia: {
    name: "Colombia",
    guide:
      "Colombia combina mercados profundos en Bogotá y Medellín con adopción cripto creciente. Cierres entre particulares con USDC y BTC ganan terreno.",
  },
  argentina: {
    name: "Argentina",
    guide:
      "Argentina opera en dólares cripto desde hace años: Buenos Aires lidera volúmenes. Publicar en cripto aquí es hablar el idioma del comprador.",
  },
  chile: {
    name: "Chile",
    guide:
      "Chile ofrece el mercado más estable del Cono Sur con Santiago a la cabeza. Ideal para diversificar con cripto en la región.",
  },
  peru: {
    name: "Perú",
    guide:
      "Perú crece con Lima como centro: Miraflores y Barranco atraen extranjeros e inversionistas. La adopción cripto avanza entre jóvenes.",
  },
  brasil: {
    name: "Brasil",
    guide:
      "Brasil, con São Paulo a la cabeza, tiene el mercado más profundo de Latam. Inversores regionales diversifican en reales y en cripto.",
  },
  panama: {
    name: "Panamá",
    guide:
      "Panamá, economía dolarizada y hub financiero, facilita operaciones con cripto. La capital concentra banca, expats e inversión.",
  },
  "costa-rica": {
    name: "Costa Rica",
    guide:
      "Costa Rica une estabilidad, turismo y comunidad expat sólida. San José y las costas sostienen demanda premium.",
  },
  "republica-dominicana": {
    name: "República Dominicana",
    guide:
      "República Dominicana crece con turismo, nearshoring y remesas. Santo Domingo concentra negocios e inversión extranjera.",
  },
};

// ¿El slug es un país del registro? Devuelve la ficha o null.
export function knownCountry(countrySlug) {
  return countryGuides[countrySlug] || null;
}

// [{ slug, name }] de todos los países (directorio + sitemap).
export function countryEntries() {
  return Object.entries(countryGuides).map(([slug, entry]) => ({
    slug,
    name: entry.name,
  }));
}

// Normaliza para comparar ("Mérida" matchea "merida").
function norm(text) {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Coincidencias geo para el autocompletado del buscador: ciudades populares,
// estados y países cuyo nombre contiene el término (insensible a acentos y
// mayúsculas). Mínimo 2 caracteres; ciudades, luego estados, luego países.
export function matchGeos(query, limit = 4) {
  const q = norm(query);
  if (q.length < 2) return [];
  const cities = [];
  const states = [];
  const countries = [];
  for (const c of popularCities) {
    // Especificidad: nombre de ciudad > nombre de estado > país. Sin esto,
    // "mex" devolvería primero cualquier ciudad mexicana en vez de la
    // Ciudad de México (Array.sort es estable: respeta el orden curado).
    const score = norm(c.city).includes(q)
      ? 0
      : norm(c.state).includes(q)
        ? 1
        : norm(c.country).includes(q)
          ? 2
          : -1;
    if (score >= 0) {
      cities.push({
        score,
        hit: {
          kind: "city",
          label: c.city,
          sub: `${c.state} · ${c.country}`,
          url: `/propiedades/${c.stateSlug}/${c.citySlug}`,
        },
      });
    }
  }
  for (const [slug, entry] of Object.entries(stateGuides)) {
    const score = norm(entry.name).includes(q)
      ? 0
      : norm(entry.country).includes(q)
        ? 1
        : -1;
    if (score >= 0) {
      states.push({
        score,
        hit: {
          kind: "state",
          label: entry.name,
          sub: `Estado · ${entry.country}`,
          url: `/propiedades/${slug}`,
        },
      });
    }
  }
  cities.sort((a, b) => a.score - b.score);
  states.sort((a, b) => a.score - b.score);
  const cityHits = cities.map((c) => c.hit);
  const stateHits = states.map((s) => s.hit);
  for (const [slug, entry] of Object.entries(countryGuides)) {
    if (norm(entry.name).includes(q)) {
      countries.push({
        kind: "country",
        label: entry.name,
        sub: "País",
        url: `/propiedades/pais/${slug}`,
      });
    }
  }
  // Round-robin por tipo (ciudad, estado, país): si solo se concatenara,
  // las ciudades llenarían el cupo y los países/estados jamás aparecerían
  // (ej. "mex" matchea decenas de ciudades antes que al país México).
  const hits = [];
  for (let i = 0; hits.length < limit; i += 1) {
    const round = [cityHits[i], stateHits[i], countries[i]].filter(Boolean);
    if (round.length === 0) break;
    for (const hit of round) {
      if (hits.length >= limit) break;
      hits.push(hit);
    }
  }
  return hits;
}

// Prefill del héroe: deriva { country, stateSlug, cityKey } del path actual
// para que los selects muestren dónde estás después de navegar (ciudad,
// estado, país o ficha). `country` es el NOMBRE (valor de las <option>);
// `cityKey` es "estado/ciudad". País desconocido → "", pero los slugs del
// path se devuelven tal cual (el inventario puede traer ciudades/estados
// fuera del registro curado). Rutas sin geo → todo vacío.
export function guessGeoFromPath(pathname) {
  const empty = { country: "", stateSlug: "", cityKey: "" };
  const parts = (pathname || "").split("/").filter(Boolean);
  if (parts[0] !== "propiedades" || !parts[1]) return empty;
  if (parts[1] === "pais") {
    const entry = parts[2] ? knownCountry(parts[2].toLowerCase()) : null;
    return { country: entry?.name || "", stateSlug: "", cityKey: "" };
  }
  // "ciudad" es el directorio (/propiedades/ciudad) o la ruta legacy que
  // redirige: ninguno pinta el héroe con geo.
  if (parts[1] === "ciudad") return empty;
  const stateSlug = parts[1].toLowerCase();
  const citySlug = parts[2]?.toLowerCase();
  if (!citySlug) {
    return {
      country: stateGuides[stateSlug]?.country || "",
      stateSlug,
      cityKey: "",
    };
  }
  const popular = popularCities.find(
    (c) => c.stateSlug === stateSlug && c.citySlug === citySlug,
  );
  return {
    country: popular?.country || stateGuides[stateSlug]?.country || "",
    stateSlug,
    cityKey: `${stateSlug}/${citySlug}`,
  };
}
