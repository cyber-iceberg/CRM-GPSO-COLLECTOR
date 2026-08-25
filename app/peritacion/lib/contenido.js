export const META = {
  version: "v5",
  titulo: "Peritación Collector",
  puntos_comprobacion: 140,
  subtitulo: "Revisión guiada de 140 puntos",
};

export const BLOQUES = [
  {
    id: "documentacion_del_vehiculo",
    nombre: "Documentación del vehículo",
    max: 13,
    intro: "La base documental no vende el coche, pero puede frenarte una mala compra. Antes de mirar chapa, mira papeles: si un dato importante cambia según quién lo cuente, eso ya es una señal.",
    fotos: [
      { id: "teil1", label: "Teil I (permiso)" },
      { id: "teil2", label: "Teil II (ficha)" },
      { id: "historial", label: "Historial / facturas" },
    ],
    items: [
      { t: "El VIN coincide con el coche y la documentación", pen: 3, rojo: true, tip: {
        hacer: "Compara el bastidor grabado (salpicadero, vano motor, puerta) con el de los papeles, dígito a dígito.",
        normal: "Los caracteres coinciden exactamente en todos los sitios.",
        alerta: "Cualquier diferencia, grabado repasado o zona manipulada. Un VIN que no cuadra para toda la compra." } },
      { t: "Teil I disponible", pen: 1, tip: {
        hacer: "Pide el permiso de circulación alemán (Zulassungsbescheinigung Teil I).",
        normal: "Existe y los datos son coherentes con el coche.",
        alerta: "No lo tienen físicamente o 'te lo mandan luego'. Sin él no matriculas en España." } },
      { t: "Teil II disponible", pen: 2, rojo: true, tip: {
        hacer: "Pide la ficha técnica / título de propiedad (Teil II) en mano.",
        normal: "Lo tienen físicamente y a nombre coherente.",
        alerta: "No aparece o lo prometen para después. Sin Teil II la importación se complica muchísimo." } },
      { t: "CoC disponible o verificable", pen: 1, tip: {
        hacer: "Pregunta por el Certificado de Conformidad europeo (CoC).",
        normal: "Lo tienen, o es fácil de pedir a la marca.",
        alerta: "No existe y la marca lo cobra caro. Anótalo como coste de homologación." } },
      { t: "Historial de mantenimiento disponible", pen: 1, tip: {
        hacer: "Revisa el libro de revisiones o el registro digital de la marca.",
        normal: "Historial no perfecto pero coherente con los km.",
        alerta: "No existe o está lleno de huecos: desconfía de los km y del cuidado." } },
      { t: "Facturas o pruebas de mantenimiento", pen: 1, tip: {
        hacer: "Pide facturas de las revisiones y reparaciones.",
        normal: "Que falte alguna secundaria si el resto cuadra.",
        alerta: "Facturas escasas o desordenadas en un coche que se vende como cuidado." } },
      { t: "Kilometraje coherente con historial y estado", pen: 3, rojo: true, tip: {
        hacer: "Cruza los km del cuadro con los sellos, las facturas y el desgaste real (volante, asiento, pedales).",
        normal: "El uso que ves encaja con los km que marca.",
        alerta: "El coche 'tiene más uso' del que dicen los km. Es la pista nº1 de un cuentakilómetros tocado." } },
      { t: "Número de propietarios coherente", pen: 1, tip: {
        hacer: "Mira cuántos dueños ha tenido y en qué plazo.",
        normal: "Un número lógico para la edad del coche.",
        alerta: "Muchos dueños en poco tiempo o dudas sobre la titularidad." } },
      { t: "Sin incoherencias claras en la documentación", pen: 3, tip: {
        hacer: "Contrasta fechas, matrículas y datos entre anuncio y papeles.",
        normal: "Todo cuadra entre sí y con lo que ves.",
        alerta: "Fechas que no encajan, datos que se contradicen, información que cambia." } },
      { t: "Sin datos sospechosos o información poco clara", pen: 2, tip: {
        hacer: "Fíjate en cómo responde el vendedor cuando pides algo básico.",
        normal: "Explica el coche con claridad y sin evasivas.",
        alerta: "Respuestas vagas, documentación 'a medias', resistencia a enviar lo esencial." } },
    ],
    banderas: ["VIN o bastidor incoherente","Kilometraje claramente dudoso","Documentación esencial ausente","Incoherencias graves entre papeles y vehículo","Información documental claramente sospechosa"],
    lectura: [[13,13,"Base documental muy sólida"],[10,12,"Buena, con detalles menores"],[7,9,"Hay dudas que revisar o negociar"],[3,6,"Riesgo alto, mucha cautela"],[0,2,"Situación muy preocupante"]],
  },
  {
    id: "carroceria_y_pintura",
    nombre: "Carrocería y pintura",
    max: 10,
    intro: "El exterior avisa antes que el resto. Un defecto estético no pesa igual que un indicio de golpe fuerte. Varias señales pequeñas juntas suelen contar una historia.",
    espesometro: true,
    fotos: [
      { id: "front", label: "Frontal" },{ id: "trasera", label: "Trasera" },
      { id: "lat_izq", label: "Lateral izquierdo" },{ id: "lat_der", label: "Lateral derecho" },
      { id: "techo", label: "Techo" },
    ],
    items: [
      { t: "Pintura visualmente uniforme", pen: 1, tip: {
        hacer: "Mira el coche entero a la luz, desde varios ángulos.",
        normal: "Brillo y textura uniformes en toda la carrocería.",
        alerta: "Zonas más mates, más brillantes o con 'piel de naranja' distinta: repintado." } },
      { t: "Sin diferencias de tono entre piezas", pen: 2, tip: {
        hacer: "Ponte en diagonal y compara pieza con pieza (puerta vs aleta).",
        normal: "El tono es igual entre piezas contiguas.",
        alerta: "Una pieza con tono claramente distinto: se repintó, pregunta por qué." } },
      { t: "Sin golpes fuertes visibles", pen: 2, tip: {
        hacer: "Recorre el coche buscando golpes o abolladuras marcadas.",
        normal: "Bollos pequeños de aparcamiento.",
        alerta: "Golpe importante en zona estructural (aleta, montante, larguero): mira debajo." } },
      { t: "Sin abolladuras importantes", pen: 1, tip: {
        hacer: "Mira los laterales a contraluz, con la luz rasante.",
        normal: "Marcas leves de uso.",
        alerta: "Una zona hundida o abollada de forma clara." } },
      { t: "Sin arañazos graves", pen: 1, tip: {
        hacer: "Repasa las superficies buscando arañazos que lleguen a chapa.",
        normal: "Arañazos leves del uso diario.",
        alerta: "Arañazos profundos, largos o en zona amplia: coste de pintura." } },
      { t: "Paragolpes delantero correcto", pen: 1, tip: {
        hacer: "Mira ajuste y sujeción del paragolpes delantero.",
        normal: "Repintado limpio y bien ajustado.",
        alerta: "Holguras raras o grapas rotas que delaten un desmontaje por golpe." } },
      { t: "Paragolpes trasero correcto", pen: 1, tip: {
        hacer: "Mira ajuste del paragolpes trasero y las piezas de al lado.",
        normal: "Un repintado aislado por roce de aparcar.",
        alerta: "El repintado se 'contagia' a la aleta o al portón: ya no es un roce." } },
      { t: "Ajustes de puertas, capó y maletero", pen: 2, tip: {
        hacer: "Compara las holguras (separación entre piezas) a ambos lados.",
        normal: "Holguras iguales y simétricas.",
        alerta: "Una holgura distinta a su gemela: pista clásica de golpe reparado." } },
      { t: "Sin holguras raras entre piezas", pen: 2, tip: {
        hacer: "Recorre las juntas con vista y dedo, mira la tornillería.",
        normal: "Juntas regulares, tornillos de fábrica.",
        alerta: "Junta que se abre/cierra raro o tornillería marcada: pieza desmontada." } },
      { t: "Faros y pilotos en buen estado", pen: 1, tip: {
        hacer: "Míralos y busca la fecha grabada en el faro.",
        normal: "Enteros y con fecha coherente con el año del coche.",
        alerta: "Un faro mucho más nuevo que el resto: suele significar golpe en ese frontal." } },
      { t: "Lunas sin daños importantes", pen: 1, tip: {
        hacer: "Busca impactos y grietas; mira la fecha grabada en el borde del cristal.",
        normal: "Sin daños relevantes; lunas coherentes entre sí.",
        alerta: "Una luna mucho más nueva que las demás: pregunta por qué se cambió." } },
      { t: "Bajos sin golpes preocupantes", pen: 1, tip: {
        hacer: "Agáchate y mira bajos y plásticos protectores.",
        normal: "Roces de badén normales.",
        alerta: "Golpes fuertes, plásticos arrancados o marcas de haber tocado fuerte." } },
      { t: "Sin señales claras de reparación deficiente", pen: 2, rojo: true, tip: {
        hacer: "Busca masilla, lijado al tacto, sobrepulverización o cinta mal quitada.",
        normal: "Acabado fino y uniforme.",
        alerta: "Reparación que se ve o se toca. Si algo no se ve fino, se apunta aunque no sepas explicarlo." } },
    ],
    banderas: ["Golpe importante mal resuelto","Reparación visualmente muy deficiente","Desalineaciones graves con sospecha de daño serio","Exterior incompatible con la historia del coche"],
    lectura: [[10,10,"Exterior en muy buen estado"],[8,9,"Buen estado con detalles menores"],[5,7,"Señales a revisar o negociar"],[2,4,"Riesgo alto, mucha cautela"],[0,1,"Estado muy preocupante"]],
  },
  {
    id: "estructura_del_vehiculo",
    nombre: "Estructura del vehículo",
    max: 18,
    intro: "Aquí no se negocia como en estética: una mala estructura pesa muchísimo. Un coche bonito por fuera puede esconder una base mala. Si una zona genera duda seria, no la compenses con precio.",
    fotos: [
      { id: "vano", label: "Vano motor (torretas, largueros)" },
      { id: "maletero", label: "Maletero (rueda repuesto)" },
      { id: "bajos", label: "Bajos" },
    ],
    items: [
      { t: "Sin señales claras de golpe estructural", pen: 3, rojo: true, tip: {
        hacer: "Abre capó y maletero, mira largueros y torretas de amortiguación.",
        normal: "Simétricos, lisos, sin dobleces ni arrugas.",
        alerta: "Un larguero arrugado o enderezado: golpe estructural." } },
      { t: "Sin soldaduras extrañas visibles", pen: 3, rojo: true, tip: {
        hacer: "Busca los puntos de soldadura de fábrica en vanos y pilares.",
        normal: "Puntos regulares, limpios, uniformes.",
        alerta: "Cordones irregulares o hechos a mano: se ha cortado y unido chapa." } },
      { t: "Sin deformaciones en zonas críticas", pen: 2, tip: {
        hacer: "Comprueba simetría: dos torretas iguales, dos largueros iguales.",
        normal: "Todo simétrico y centrado.",
        alerta: "Asimetría sin explicación: huella de un empujón." } },
      { t: "Frontal con aspecto coherente", pen: 2, tip: {
        hacer: "Mira el travesaño delantero, soportes de faros y chapa del frontal.",
        normal: "Aspecto de fábrica en todo el frontal.",
        alerta: "Chapa nueva, masilla o tornillería tocada: golpe delantero." } },
      { t: "Trasera con aspecto coherente", pen: 2, tip: {
        hacer: "Levanta la moqueta del maletero y mira el hueco de la rueda de repuesto.",
        normal: "Cubeta lisa, simétrica, pintura de fábrica.",
        alerta: "Arrugas, masilla o pintura distinta: golpe trasero reparado." } },
      { t: "Maletero sin señales raras de reparación", pen: 1, tip: {
        hacer: "Mira el suelo del maletero y el sellador de las uniones.",
        normal: "Suelo liso, sellador uniforme de fábrica.",
        alerta: "Ondulaciones, soldaduras o sellador aplicado a mano." } },
      { t: "Suelo y bajos sin daños preocupantes", pen: 1, tip: {
        hacer: "Por debajo, mira que el suelo esté recto y con su tratamiento.",
        normal: "Chapa recta, tratamiento original intacto.",
        alerta: "Chapa doblada, sellador fresco o zonas retocadas." } },
      { t: "Sin corrosión importante", pen: 2, rojo: true, tip: {
        hacer: "Revisa largueros, apoyos y anclajes de cinturones; rasca con cuidado si dudas.",
        normal: "Óxido superficial que no afecta a nada.",
        alerta: "Óxido que perfora, hincha la chapa o salta en escama en zona estructural." } },
      { t: "Sin reparaciones mal ejecutadas en zona estructural", pen: 1, tip: {
        hacer: "Examina cualquier reparación en largueros, pilares o apoyos de suspensión.",
        normal: "Reparación impecable, si la hay.",
        alerta: "Reparación pobre en zona que aguanta esfuerzos: compromete la seguridad." } },
      { t: "Sin indicios de bancada o reconstrucción seria", pen: 1, rojo: true, tip: {
        hacer: "Busca marcas de mordazas de bancada en los bajos y tornillos de anclaje.",
        normal: "Sin rastro de haber estado en bancada.",
        alerta: "Marcas de anclaje o zonas 'estiradas': pasa a rojo hasta demostrar lo contrario." } },
    ],
    banderas: ["Golpe estructural","Reparación estructural mal ejecutada","Soldaduras o deformaciones preocupantes","Señales de bancada o reconstrucción seria","Corrosión importante en zona estructural"],
    lectura: [[18,18,"Estructura muy sólida"],[15,17,"Buen estado con dudas menores"],[9,14,"Señales a revisar con atención"],[4,8,"Riesgo muy alto"],[0,3,"Estado crítico"]],
  },
  {
    id: "motor",
    nombre: "Motor",
    max: 14,
    intro: "El arranque en frío es la prueba más importante y la que más se salta la gente: un motor frío enseña lo que uno caliente esconde. Un síntoma aislado no siempre mata la compra; varias señales pequeñas juntas, sí.",
    fotos: [{ id: "vano", label: "Vano motor" },{ id: "escape", label: "Humo del escape (al arrancar)" }],
    items: [
      { t: "Arranque en frío realizado", pen: 2,
        campo: { tipo: "opciones", label: "¿Pudiste arrancarlo en frío?", opciones: ["Sí, en frío", "Ya estaba caliente", "Pedí vídeo"] }, tip: {
        hacer: "Arráncalo con el motor totalmente frío y escucha los primeros segundos.",
        normal: "Arranca limpio y se estabiliza pronto.",
        alerta: "Si ya estaba caliente al llegar, te falta la prueba clave: pide vídeo o vuelve." } },
      { t: "Arranca con normalidad", pen: 1, tip: {
        hacer: "Gira la llave / pulsa start y cuenta lo que tarda en coger.",
        normal: "Arranca a la primera, sin insistir.",
        alerta: "Tarda, tose o da varias vueltas: batería, bujías, precalentadores o algo mayor." } },
      { t: "Ralentí estable", pen: 2, tip: {
        hacer: "Déjalo al ralentí y escucha el ritmo del motor.",
        normal: "Suena redondo y sostenido; ligera aspereza que se asienta.",
        alerta: "Sube y baja de vueltas, cabecea o vibra sin asentarse." } },
      { t: "Sin ruidos anómalos claros", pen: 2, rojo: true, tip: {
        hacer: "Escucha golpeteos o tableteos metálicos, en frío y en caliente.",
        normal: "Sonido de funcionamiento uniforme, sin golpes.",
        alerta: "Golpeteo claro y continuo: de lo más serio (distribución, taqués, algo interno)." } },
      { t: "Sin humos anormales", pen: 2, rojo: true, tip: {
        hacer: "Mira el escape al arrancar y al acelerar.",
        normal: "Vapor fino en frío que desaparece rápido.",
        alerta: "Azul (aceite), blanco espeso persistente (culata) o negro (gasoil): grave si no para." } },
      { t: "Sin fugas visibles", pen: 2, tip: {
        hacer: "Mira sudor y goteo en el motor y en el suelo bajo el coche.",
        normal: "Motor seco, sin manchas frescas debajo.",
        alerta: "Fuga visible; o un motor demasiado limpio que la esconde." } },
      { t: "Temperatura de funcionamiento correcta", pen: 1, tip: {
        hacer: "Deja calentar y vigila la aguja o el dato de temperatura.",
        normal: "Sube al punto normal y se queda ahí.",
        alerta: "Sube de más, oscila, o el ventilador se dispara pronto: refrigeración." } },
      { t: "Respuesta al acelerar limpia", pen: 1, tip: {
        hacer: "Con el motor caliente, acelera y nota cómo sube de vueltas.",
        normal: "Limpio y decidido.",
        alerta: "Vacío, tirón o respuesta perezosa: admisión, turbo, inyección o electrónica." } },
      { t: "Sin testigos encendidos", pen: 1, rojo: true, tip: {
        hacer: "Con el motor en marcha, mira el cuadro.",
        normal: "Ningún testigo de avería encendido.",
        alerta: "Check engine, aceite o gestión: diagnosis obligatoria antes de decidir." } },
    ],
    banderas: ["Golpeteo claro y continuo","Humo abundante o persistente","Pérdida fuerte de potencia","Fuga importante visible","Comportamiento mecánico claramente preocupante"],
    lectura: [[14,14,"Motor muy sano"],[11,13,"Buen estado con detalles menores"],[7,10,"Señales a revisar o negociar"],[3,6,"Riesgo alto, mucha cautela"],[0,2,"Estado muy preocupante"]],
  },
  {
    id: "mecanica_y_bajos",
    nombre: "Mecánica y bajos",
    max: 12,
    intro: "Lo que no se ve desde arriba. Lo ideal es elevador o foso; si no hay, hazlo por debajo con linterna y saca fotos. No buscas que esté nuevo: buscas que no haya nada roto, vencido o a punto de dar un problema caro.",
    elevador: true,
    fotos: [
      { id: "bajos_del", label: "Bajos delanteros" },
      { id: "bajos_tras", label: "Bajos traseros" },
      { id: "correa", label: "Zona de la correa (si se ve)" },
    ],
    items: [
      { t: "Amortiguadores sin fugas ni vencidos", pen: 2, tip: {
        hacer: "Mira el cuerpo del amortiguador; hunde una esquina del coche y suéltala.",
        normal: "Seco, y el coche vuelve parando en un solo rebote.",
        alerta: "Cuerpo húmedo de aceite u oxidado; o el coche sigue botando: vencido." } },
      { t: "Correa de distribución / cadena en fecha", pen: 3, rojo: true, tip: {
        hacer: "Busca factura del último cambio; si es cadena, escucha un tableteo al arrancar.",
        normal: "Cambio demostrable dentro de km/años.",
        alerta: "Sin prueba de cambio, o cadena que tabletea: es la avería más cara si rompe." } },
      { t: "Silentblocks y gomas sin roturas", pen: 1, tip: {
        hacer: "Mira las gomas que unen brazos de suspensión al chasis, y las de motor/dirección.",
        normal: "Gomas enteras, flexibles.",
        alerta: "Agrietadas, aplastadas o partidas: dan ruidos y mala conducción." } },
      { t: "Rótulas y bieletas sin holgura", pen: 2, tip: {
        hacer: "Con la rueda en el aire, muévela arriba-abajo y lado-lado.",
        normal: "Firme, sin holgura ni 'clac'.",
        alerta: "Holgura o golpeteo: rótula o bieleta gastada, suspenso de ITV." } },
      { t: "Sin fugas en caja de cambios / diferencial", pen: 2, tip: {
        hacer: "Por debajo, mira caja de cambios y diferencial (si es propulsión/4x4).",
        normal: "Secos, sin rezumar aceite.",
        alerta: "Rezuma o gotea: caro de arreglar y a veces anuncia desgaste interno." } },
      { t: "Latiguillos y tubos de freno en buen estado", pen: 1, tip: {
        hacer: "Mira los latiguillos (gomas) y los tubos metálicos de freno.",
        normal: "Gomas flexibles sin grietas, tubos sin óxido.",
        alerta: "Latiguillos agrietados o hinchados, tubos comidos de óxido: seguridad pura." } },
      { t: "Escape completo y sin fugas", pen: 1, tip: {
        hacer: "Recorre el escape del motor al final; comprueba que el catalizador/FAP está.",
        normal: "Completo, sin golpes ni óxido perforante.",
        alerta: "Aplastado, perforado, manguitos sueltos o catalizador retirado." } },
      { t: "Sin óxido perforante en bajos", pen: 1, tip: {
        hacer: "Revisa travesaños y apoyos, sobre todo en coches del norte (sal de carretera).",
        normal: "Óxido superficial en tornillería.",
        alerta: "Óxido que hincha, escama o perfora la chapa." } },
      { t: "Sin ruidos o juegos anómalos en tren rodante", pen: 1, tip: {
        hacer: "Con las ruedas en el aire, gíralas escuchando los rodamientos y busca holguras.",
        normal: "Giran silenciosas y sin juego.",
        alerta: "Zumbido o rugido (rodamiento) o cualquier holgura al mover la rueda." } },
    ],
    banderas: ["Distribución fuera de fecha sin cambio demostrable","Fuga importante en caja o motor por debajo","Corrosión estructural en los bajos","Elemento de seguridad (freno/dirección) comprometido"],
    lectura: [[12,12,"Mecánica sana por debajo"],[10,11,"Buen estado, detalles menores"],[6,9,"Señales a revisar o presupuestar"],[3,5,"Riesgo alto, costes probables"],[0,2,"Estado muy preocupante"]],
  },
  {
    id: "cambio_y_transmision",
    nombre: "Cambio y transmisión",
    max: 9,
    intro: "Una caja tocada es de las averías que más margen se comen. Un automático sano no pega golpes claros; un manual sano no patina. Varias sensaciones raras juntas empeoran mucho la lectura.",
    fotos: [],
    items: [
      { t: "Entrada de marcha correcta", pen: 1, tip: {
        hacer: "En parado con el freno pisado, mete D y luego R; cuenta 'mil uno' hasta que responda.",
        normal: "Entra suave, con un leve toque, casi instantánea.",
        alerta: "Golpe seco o retardo largo al seleccionar." } },
      { t: "Sin golpes secos al meter D o R", pen: 2, rojo: true, tip: {
        hacer: "Repite el cambio D/R varias veces y nota el coche.",
        normal: "Toque normal de engrane.",
        alerta: "Golpe seco que se siente en todo el coche, repetido: señal seria." } },
      { t: "Sin retardo anómalo al seleccionar marcha", pen: 1, tip: {
        hacer: "Fíjate en el tiempo entre poner la marcha y que 'enganche'.",
        normal: "Retardo leve puntual.",
        alerta: "Retardo evidente y repetido: desgaste interno de la caja." } },
      { t: "Cambios suaves en conducción", pen: 1, tip: {
        hacer: "En marcha, nota las subidas y bajadas de marcha.",
        normal: "Imperceptibles (auto) o limpios (manual).",
        alerta: "Cambios bruscos, con tirón, o vueltas que suben sin acelerar (patina)." } },
      { t: "Sin tirones entre marchas", pen: 1, tip: {
        hacer: "Acelera de forma continua y nota las transiciones.",
        normal: "Alguno aislado puede ser nada.",
        alerta: "Tirones claros y repetidos: caja o su electrónica." } },
      { t: "Sin vibraciones anómalas al acelerar", pen: 1, tip: {
        hacer: "Acelera con firmeza y nota si el coche vibra.",
        normal: "Aceleración suave.",
        alerta: "Vibración fuerte: transmisión, palier o soporte." } },
      { t: "Marcha atrás correcta", pen: 1, tip: {
        hacer: "Mete R y muévete un poco hacia atrás.",
        normal: "Entra y funciona sin ruidos ni golpes.",
        alerta: "Ruido raro, golpe o retardo largo: la R delata lo que las demás disimulan." } },
      { t: "Embrague sano si es manual", pen: 1, tip: {
        hacer: "Arranca en cuesta o acelera fuerte en marcha alta.",
        normal: "El coche tira acorde a las vueltas; punto de embrague normal.",
        alerta: "Las vueltas suben pero no tira igual: embrague patinando, coste seguro." } },
    ],
    banderas: ["Golpe seco claro y repetido al meter D o R","Retardo evidente y repetido al seleccionar marcha","Tirones fuertes y constantes entre cambios","Funcionamiento claramente anómalo de caja o transmisión"],
    lectura: [[9,9,"Transmisión en muy buen estado"],[7,8,"Buen funcionamiento, detalles menores"],[4,6,"Señales a revisar o negociar"],[2,3,"Riesgo alto"],[0,1,"Estado muy preocupante"]],
  },
  {
    id: "suspension_direccion_y_frenos",
    nombre: "Suspensión, dirección y frenos",
    max: 9,
    intro: "Un coche sano se siente sólido. Cuando todo va flojo, aunque no haya avería clara, hay desgaste acumulado. Si la dirección no da seguridad, el coche pierde muchos puntos aunque el resto esté bien.",
    fotos: [],
    items: [
      { t: "Sin ruidos ni golpes secos en suspensión", pen: 1, tip: {
        hacer: "Pasa un badén despacio con la ventanilla bajada y escucha.",
        normal: "Silencio o ruido suave y amortiguado.",
        alerta: "Golpe seco repetido o 'toc-toc': amortiguador, silentblock o rótula." } },
      { t: "Sin crujidos al girar", pen: 1, tip: {
        hacer: "Gira el volante a tope parado y en marcha lenta.",
        normal: "Giro limpio, sin ruidos.",
        alerta: "'Crac-crac' al girar: junta homocinética o rótula." } },
      { t: "Dirección estable y precisa", pen: 2, rojo: true, tip: {
        hacer: "Nota la firmeza del volante y cómo responde al girar.",
        normal: "Firme y preciso, transmite seguridad.",
        alerta: "Holgura, vibración o dirección 'floja': resta mucho, es seguridad." } },
      { t: "El coche mantiene la trayectoria", pen: 1, tip: {
        hacer: "En recto, suelta un poco el volante en una zona segura.",
        normal: "Sigue derecho.",
        alerta: "Se va claramente a un lado: alineación o algo peor (cruza con neumáticos)." } },
      { t: "Sin vibraciones claras en el volante", pen: 1, tip: {
        hacer: "Nota si el volante vibra a cierta velocidad y si vibra al frenar.",
        normal: "Volante estable.",
        alerta: "Vibración constante: equilibrado; vibración al frenar: discos." } },
      { t: "Frenada recta y estable", pen: 2, rojo: true, tip: {
        hacer: "Frena progresivo y luego más fuerte, con seguridad.",
        normal: "Para recto, sin desviarse ni dar tirones.",
        alerta: "El coche se va de lado al frenar: peligroso, no negociable." } },
      { t: "Sin vibración clara al frenar", pen: 1, tip: {
        hacer: "Nota el pedal y el volante durante la frenada.",
        normal: "Frenada firme y sin pulsaciones.",
        alerta: "Pulsación o vibración al frenar: discos alabeados, coste seguro." } },
      { t: "Sin sensación de inseguridad en marcha", pen: 1, tip: {
        hacer: "Valora la impresión general al conducir.",
        normal: "Aplomo, el coche va 'plantado'.",
        alerta: "Flota, rebota o no da confianza: tren rodante cansado." } },
    ],
    banderas: ["Frenada claramente inestable o insegura","Vibración fuerte y constante al frenar","Dirección claramente imprecisa o peligrosa","Coche que se va claramente a un lado","Sensación clara de inseguridad del conjunto"],
    lectura: [[9,9,"Tren rodante y frenada muy bien"],[7,8,"Buen comportamiento, detalles menores"],[4,6,"Señales a revisar o negociar"],[2,3,"Riesgo alto"],[0,1,"Estado muy preocupante"]],
  },
  {
    id: "neumaticos_y_llantas",
    nombre: "Neumáticos y llantas",
    max: 5,
    intro: "Un neumático habla del uso real del coche. El desgaste irregular no es 'ya se cambiarán': puede delatar alineación, suspensión o un golpe. Mide cada rueda.",
    ruedas: true,
    fotos: [],
    items: [
      { t: "Dibujo suficiente y uniforme en las 4 ruedas", pen: 1, tip: {
        hacer: "Mide los mm de cada rueda (los anotas abajo).",
        normal: "Por encima de 3 mm y parejo entre ruedas.",
        alerta: "Cerca de 1,6 mm (mínimo legal) o una rueda mucho más gastada." } },
      { t: "Sin desgaste raro por interior o exterior", pen: 1, tip: {
        hacer: "Pasa la mano por el ancho de la banda de cada neumático.",
        normal: "Desgaste uniforme en todo el ancho.",
        alerta: "Un borde más gastado (geometría) o en escalones (amortiguador). Vale más que los mm." } },
      { t: "DOT razonable y medidas correctas", pen: 1, tip: {
        hacer: "Lee el DOT del flanco (4 cifras: semana y año) y comprueba la medida.",
        normal: "Menos de 6-7 años y medida correcta, igual por eje.",
        alerta: "Goma vieja aunque tenga dibujo, o medidas que no pide el coche." } },
      { t: "Misma lógica de neumáticos en el conjunto", pen: 1, tip: {
        hacer: "Compara marca y modelo de las cuatro.",
        normal: "Mismas o de gama coherente.",
        alerta: "Cuatro marcas distintas y baratas: dice del mantenimiento del dueño." } },
      { t: "Llantas sin daños graves ni deformación", pen: 1, tip: {
        hacer: "Mira el labio de la llanta por fuera y por dentro.",
        normal: "Roces de bordillo estéticos.",
        alerta: "Golpes que deformen (pérdidas de aire, vibración) o grietas." } },
    ],
    banderas: ["Conjunto rodante incompatible con la seguridad","Señales extremas de maltrato o uso anormal"],
    lectura: [[5,5,"Muy buen estado"],[4,4,"Buen estado, detalle menor"],[3,3,"Cosas a revisar o negociar"],[1,2,"Estado flojo, afecta coste y confianza"],[0,0,"Estado muy pobre"]],
  },
  {
    id: "interior_y_equipamiento",
    nombre: "Interior y equipamiento",
    max: 4,
    intro: "El interior dice mucho del uso real: volante, asiento del conductor y botoneras delatan rápido una unidad castigada. Un extra que no funciona afecta al valor. Si el desgaste no cuadra con los km, no lo ignores.",
    fotos: [
      { id: "salpicadero", label: "Salpicadero y cuadro" },
      { id: "asientos", label: "Asientos delanteros" },
      { id: "maletero_int", label: "Maletero" },
    ],
    items: [
      { t: "Volante, asiento y tapicería coherentes con los km", pen: 1, tip: {
        hacer: "Compara el desgaste de volante, asiento y pomo con los km del cuadro.",
        normal: "El desgaste encaja con los km.",
        alerta: "Volante pulido o asiento hundido en un coche de pocos km: cuentakilómetros." } },
      { t: "Botones, mandos y pantallas funcionando", pen: 1, tip: {
        hacer: "Prueba climatizador, pantalla, luces, elevalunas, navegación, cámara y sensores.",
        normal: "Todo responde; el clima enfría de verdad.",
        alerta: "Algo que no va, sobre todo el climatizador: coste habitual y a veces caro." } },
      { t: "Extras anunciados coinciden con la realidad", pen: 1, tip: {
        hacer: "Repasa el anuncio con el coche delante, extra por extra.",
        normal: "Está todo lo prometido y funciona.",
        alerta: "Un extra anunciado que no está o no funciona: cambia el precio." } },
      { t: "Llaves disponibles según lo prometido", pen: 1,
        campo: { tipo: "numero", label: "Nº de llaves", placeholder: "2" }, tip: {
        hacer: "Cuenta las llaves físicamente.",
        normal: "Dos llaves, lo habitual.",
        alerta: "Una sola: resta valor y una segunda cuesta dinero." } },
    ],
    banderas: ["Desgaste interior incoherente con los km","Equipamiento clave anunciado que no existe o no funciona"],
    lectura: [[4,4,"Interior muy bien"],[3,3,"Buen estado, detalle menor"],[2,2,"Cosas a revisar o negociar"],[1,1,"Estado flojo o incoherente"],[0,0,"Estado muy preocupante"]],
  },
  {
    id: "diagnosis_y_electronica",
    nombre: "Diagnosis y electrónica",
    max: 3,
    intro: "La diagnosis no es para asustarte, es para decidir con más información. Un fallo histórico no vale lo mismo que uno activo, y motor, caja, emisiones y seguridad van por encima del resto.",
    fotos: [{ id: "diag", label: "Pantalla de la máquina de diagnosis" }],
    items: [
      { t: "Diagnosis realizada", pen: 1,
        campo: { tipo: "opciones", label: "¿Se hizo diagnosis?", opciones: ["Sí", "No"] }, tip: {
        hacer: "Conecta la máquina de diagnosis si puedes.",
        normal: "Se realiza y se guarda la lectura.",
        alerta: "Sin diagnosis la peritación queda coja: es lo más barato y lo que más discusiones cierra." } },
      { t: "Sin errores graves activos (motor, caja, emisiones)", pen: 1, rojo: true, tip: {
        hacer: "Separa errores activos de históricos y guarda captura de los códigos.",
        normal: "Sin activos, o solo históricos menores.",
        alerta: "Activos de motor, caja o emisiones: los caros. Presupuesta antes de negociar." } },
      { t: "Batería, testigos y sistemas coherentes", pen: 1, tip: {
        hacer: "Mira el estado de batería y que no queden testigos raros.",
        normal: "Lectura coherente con lo que transmite el coche.",
        alerta: "La máquina dice una cosa y el coche otra: entiende por qué." } },
    ],
    banderas: ["Errores graves activos de motor","Errores graves activos de caja","Errores graves de emisiones","Acumulación preocupante de fallos graves"],
    lectura: [[3,3,"Diagnosis limpia"],[2,2,"Detalle menor"],[1,1,"Riesgo alto, cautela"],[0,0,"Estado muy preocupante"]],
  },
  {
    id: "prueba_dinamica",
    nombre: "Prueba dinámica",
    max: 3,
    intro: "No es dar una vuelta: es confirmar si el coche transmite salud. Puede estar bonito parado y no convencer en marcha. Si aparecen varios síntomas pequeños al rodar, la lectura final empeora.",
    fotos: [],
    items: [
      { t: "Sale, acelera y responde limpio", pen: 1, tip: {
        hacer: "Arranca la marcha y acelera con decisión, a varias velocidades.",
        normal: "Sale limpio, sube de vueltas progresivo.",
        alerta: "Tirones o vacíos al acelerar." } },
      { t: "Dirección, frenada y cambio coherentes en marcha", pen: 1, rojo: true, tip: {
        hacer: "En movimiento, confirma dirección, frenada y cambios.",
        normal: "Dirección firme, frenada recta, cambios limpios.",
        alerta: "Lo que en parado era duda se confirma aquí: dirección o frenada inseguras." } },
      { t: "Sin ruidos ni testigos nuevos al rodar, temperatura estable", pen: 1, tip: {
        hacer: "Escucha ruidos que solo salen en marcha y vigila cuadro y temperatura.",
        normal: "Sin ruidos nuevos, sin testigos, temperatura estable.",
        alerta: "Rodamientos, testigo que salta o temperatura que se dispara tras rodar." } },
    ],
    banderas: ["Testigos preocupantes durante la prueba","Tirones fuertes y repetidos","Vibración fuerte y constante en conducción","Frenada claramente mala o insegura","Dirección claramente insegura"],
    lectura: [[3,3,"Muy buena prueba dinámica"],[2,2,"Buen comportamiento, detalle menor"],[1,1,"Riesgo alto, cautela"],[0,0,"Estado muy preocupante"]],
  },
];

export const PIEZAS_PINTURA = [
  { id: "capo", label: "Capó" },{ id: "techo", label: "Techo" },{ id: "porton", label: "Portón / maletero" },
  { id: "ad_der", label: "Aleta del. dcha" },{ id: "ad_izq", label: "Aleta del. izq" },
  { id: "pd_der", label: "Puerta del. dcha" },{ id: "pd_izq", label: "Puerta del. izq" },
  { id: "pt_der", label: "Puerta tras. dcha" },{ id: "pt_izq", label: "Puerta tras. izq" },
  { id: "at_der", label: "Aleta tras. dcha" },{ id: "at_izq", label: "Aleta tras. izq" },
  { id: "pilar_der", label: "Pilares dcho" },{ id: "pilar_izq", label: "Pilares izq" },
];

export const REF_MICRAS = "Fábrica 80–150 µm · 150–250 µm repintado probable · más de 300 µm masilla / golpe. Lo que canta es una pieza muy por encima de sus vecinas.";

export const RUEDAS = [
  { id: "del_izq", label: "Delantera izquierda" },{ id: "del_der", label: "Delantera derecha" },
  { id: "tras_izq", label: "Trasera izquierda" },{ id: "tras_der", label: "Trasera derecha" },
];
