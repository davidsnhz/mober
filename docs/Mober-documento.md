# Mober — Documento de proyecto

> Transcripción del documento original (PDF, 11 de noviembre de 2026). Donde este documento
> contradiga las decisiones de implementación recogidas en el README, manda la implementación.

## Resumen

Mober es una app móvil minimalista para apuntar quién te debe dinero, cuánto y por qué, y que te
lo recuerda sola con notificaciones. El nombre une _money_ y _remember_.

**El problema.** Pagas una cena, una entrada o un taxi, la otra persona dice "ya te lo paso" y
ambos lo olvidáis. Son cantidades pequeñas que no merecen una hoja de cálculo, pero que sumadas
pesan.

**La propuesta.** Apuntarlo cuesta menos de 5 segundos: nombre, cantidad y, si quieres, el
concepto. A partir de ahí Mober se acuerda por ti.

### Principios del producto

- Una sola tarea: registrar lo que te deben y no olvidarlo.
- Sin cuentas, sin registro y sin servidor: los datos se quedan en el móvil.
- Útil sin abrirla: notificaciones y, más adelante, un widget en la pantalla de inicio.

## Funcionalidades de la primera versión

La versión 1.0 hace cinco cosas y ninguna más. Todo lo demás va a sugerencias o fases posteriores.

| Función            | Qué hace                                                         | Cómo se usa                                                         |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| Añadir deuda       | Guarda persona, cantidad, concepto opcional y fecha (automática) | Botón verde "+" siempre visible; teclado numérico abierto al entrar |
| Lista "Me deben"   | Total arriba en grande y debajo una fila por persona con su suma | Pantalla de inicio; ordenada por antigüedad                         |
| Detalle de persona | Todas las deudas de esa persona con concepto y fecha             | Tocar una fila de la lista                                          |
| Marcar como pagado | Pasa la deuda al historial con la fecha de pago                  | Deslizar a la derecha o botón en el detalle; se puede deshacer      |
| Recordatorios      | Notificaciones periódicas con quién te debe y cuánto             | Se activan solas al añadir la primera deuda; ajustables             |

**Agrupar por persona.** Si Pedro te debe la cena y el cine, en la lista aparece una sola fila
"Pedro · 32,50 €" con "2 deudas" debajo. La lista se mantiene corta aunque apuntes mucho.

**Autocompletar nombres.** Al escribir un nombre, Mober sugiere las personas que ya has usado.
Así no aparecen "Pedro" y "pedro" como dos personas distintas.

## Notificaciones

Las notificaciones se programan en el propio móvil, sin servidor: funcionan sin conexión y ningún
dato sale del teléfono. Hay dos tipos y ambos se pueden ajustar o apagar.

| Tipo                 | Cuándo llega                                                                                               | Ejemplo de texto                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Resumen periódico    | Por defecto, una vez a la semana (domingo por la tarde); elegible: cada 3 días, semanal, quincenal o nunca | "Te deben 47,50 € entre 3 personas. Pedro 20 €, Lucía 15 €, Javi 12,50 €." |
| Aviso por antigüedad | Cuando una deuda cumple 7 y 30 días sin pagarse                                                            | "Hace una semana que Lucía te debe 15 € (entradas del concierto)."         |

**Acciones desde la notificación.** Al mantener pulsada la notificación aparecen dos botones:
"Pagado" y "Recordar a Pedro". Así no hace falta abrir la app.

**Privacidad.** Opción "Ocultar cantidades en pantalla bloqueada": la notificación dice "Tienes 3
cobros pendientes" sin nombres ni importes.

**Tono.** Nunca culpabilizador ni insistente. Máximo una notificación al día; si coinciden
varias, se agrupan en una.

## Diseño e identidad visual

Blanco y negro llevan la elegancia; el verde aparece solo donde hay dinero o una acción. La regla:
el verde nunca ocupa más del 10 % de la pantalla, así siempre llama la atención.

| Color       | Hex     | Uso                                                                           |
| ----------- | ------- | ----------------------------------------------------------------------------- |
| Negro tinta | #0B0B0C | Texto principal, botones secundarios, fondo en modo oscuro                    |
| Blanco      | #FFFFFF | Fondo de tarjetas y pantalla, texto en modo oscuro                            |
| Gris niebla | #F4F4F2 | Fondo general detrás de las tarjetas                                          |
| Gris línea  | #E5E5E1 | Separadores y bordes                                                          |
| Gris texto  | #6E6E6A | Conceptos, fechas, texto secundario                                           |
| Verde Mober | #00C26F | Botones, símbolo € del total y del logo, estados de "pagado"; con texto negro |
| Verde texto | #067A46 | Texto verde sobre blanco (contraste legible)                                  |
| Verde noche | #2EE88C | El verde del modo oscuro, sobre negro                                         |

**Tipografía.** Inter en toda la app, con cifras tabulares para que las cantidades queden
alineadas. El total va en 44–56 pt y peso semibold; el resto en 15–17 pt.

### Principios de interfaz

- La cantidad es la protagonista: lo primero que se ve en cada pantalla es un número.
- Una acción principal por pantalla, siempre en verde y al alcance del pulgar.
- Sin iconos decorativos ni ilustraciones: iniciales en círculo para cada persona.
- Feedback táctil (vibración suave) al guardar y al marcar como pagado.
- Modo oscuro desde el primer día: negro puro, blanco y verde noche.

**Logo.** Una "m" minúscula en negro con un € pequeño en verde arriba a la derecha: la m de
_money_ y el dinero en una sola marca. El icono de la app es la misma "m" sobre fondo negro o
blanco, y el logotipo completo es "mober€".

## Pantallas y flujo de uso

La app tiene cuatro pantallas y todo se resuelve en uno o dos toques. La muestra de diseño está
en [`docs/diseno/`](diseno/), con modo claro, modo oscuro, notificaciones e identidad visual.

| Pantalla           | Qué muestra                                                                                   | Acción principal      |
| ------------------ | --------------------------------------------------------------------------------------------- | --------------------- |
| Inicio · Me deben  | Total en grande y una fila por persona                                                        | Apuntar deuda         |
| Nueva deuda        | Cantidad, persona con sugerencias y concepto; teclado numérico propio                         | Guardar               |
| Detalle de persona | Total de esa persona, deudas pendientes e historial                                           | Recordar por WhatsApp |
| Ajustes            | Frecuencia y hora de avisos, tono y plantilla del mensaje, ocultar cantidades, tema, exportar | —                     |

Los botones de la notificación ("Pagado" y "Recordar") llevan a los mismos destinos sin pasar por
la app.

**Sin deudas pendientes.** Inicio cambia a un estado vacío: círculo verde con un tick, "Nadie te
debe nada", un enlace al historial y el botón para apuntar. Las notificaciones se pausan solas
hasta la siguiente deuda.

**Detalle de persona.** Bajo el nombre aparece "Contacto vinculado" cuando la persona tiene un
contacto del móvil asociado; si no lo tiene, en su lugar aparece el botón "Vincular contacto".

## Stack técnico recomendado

Recomendación: app nativa con React Native y Expo, no PWA. El motivo es la función central, las
notificaciones: una web no puede programar avisos locales fiables, y en iPhone solo recibe
notificaciones si se instala en la pantalla de inicio y hay un servidor de push detrás. Con Expo
los avisos se programan en el móvil y la app se publica en App Store y Google Play con una sola
base de código.

| Capa              | Elección                                       | Por qué                                                                  |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| Framework         | React Native + Expo + TypeScript               | iOS y Android a la vez; builds en la nube con EAS                        |
| Navegación        | Expo Router                                    | Rutas por archivos, transiciones nativas                                 |
| Datos             | expo-sqlite (local)                            | Sin cuentas ni servidor; rápido y privado                                |
| Estado            | Zustand                                        | Mínimo código para una app pequeña                                       |
| Notificaciones    | expo-notifications (programadas en local)      | Funcionan sin conexión; admiten botones de acción                        |
| Animación y tacto | Reanimated + Gesture Handler + expo-haptics    | Deslizar para pagar, vibración al guardar                                |
| Mensajes          | Enlace a WhatsApp (wa.me) con texto prellenado | Abre el chat del contacto vinculado, elegido con el selector del sistema |

**Modelo de datos.** Dos tablas bastan: `people` y `debts`, con la cantidad en céntimos como
entero para evitar errores de redondeo.

## Sugerencias

### Nombre

Mantener Mober: es corto, se pronuncia igual en español e inglés y la historia (money + remember)
se entiende en una línea. Un aviso: ya existe Mober, una empresa de logística de Filipinas. Es
otro sector, pero antes de publicar conviene revisar marcas en la EUIPO y si están libres el
dominio y el nombre en las tiendas.

- Eslogan propuesto: "Lo que te deben, recordado." (en inglés: "Money, remembered.")
- Nombre en tiendas: "Mober — Quién me debe".

### Funciones, por orden de valor

1. **Recordar por WhatsApp.** Un botón en el detalle de cada persona abre WhatsApp con un mensaje
   ya escrito. Cada persona se vincula a un contacto del móvil con el selector del sistema, y el
   mensaje usa el tono elegido en Ajustes (Amable, Directo o Con humor) o una plantilla propia con
   `{nombre}`, `{cantidad}` y `{concepto}`. Siempre llega a WhatsApp sin enviar, para retocarlo.
2. **Widget en la pantalla de inicio.** Total y las tres personas que más deben.
3. **Fecha prometida.** Apuntar "te lo paso el viernes" y avisar ese día.
4. **Pagos parciales.**
5. **Dividir un gasto.**
6. **Bloqueo con Face ID / huella**, opcional.
7. **Exportar copia** a un archivo.

### Qué se deja fuera a propósito

- Cuentas de usuario y sincronización en la nube.
- Gráficos y estadísticas.
- La pestaña "Yo debo".

## Hoja de ruta

Tres fases y dos puntos de control. La fase 1 ya es una app usable por sí sola; cada fase solo
empieza cuando se supera su punto de control. Los puntos de control son pruebas reales: usarla
con deudas propias y después con un grupo pequeño de amigos (TestFlight en iPhone, prueba interna
en Android) antes de publicar.
