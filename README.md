# Aranceles y Simulador de Cuota · Biblioteca Popular El Tintero Viajero

Web vecinal de la Biblioteca Popular El Tintero Viajero (Paraná, Entre Ríos, Argentina) para consultar los aranceles y calcular cuánto se paga por mes, por trimestre o por semestre.

## 1. Descripción y objetivo

Hoy los precios de la biblioteca (cuotas, talleres, servicios) andan sueltos y cada familia termina haciendo la cuenta a mano. Este proyecto:

- ordena todos los aranceles en un solo lugar, con una estética de "ficha de biblioteca";
- calcula presupuestos individuales o familiares en segundos;
- **no pide cuentas de usuario, no tiene inicio de sesión y no cobra online**: es solo para informarse y estimar.

## 2. Funcionalidades principales

### Pantalla 1 · Catálogo de aranceles (`/`)
- Tres grupos: **Cuotas sociales**, **Talleres** y **Servicios**.
- **Buscador normalizado**: no distingue tildes ni mayúsculas ("encuadernacion" encuentra "Encuadernación").
- **Filtro por grupo**.
- Interruptor para ver los precios de talleres con el 20% de descuento de socios.
- Cada ficha muestra precio, unidad, estado (vigente, suspendido, sin cargo), cupo y horario.

### Pantalla 2 · Simulador de cuota (`/simulador`)
- Se elige tipo de socio (o no socio), hasta 3 talleres, cantidad de fotocopias y período: **1, 3 o 6 meses**.
- Reglas de negocio:
  - **20% de descuento en talleres para socios**.
  - **15% de descuento por pagar 6 meses, solo sobre la cuota social** (no sobre talleres ni fotocopias).
  - **Máximo 3 talleres simultáneos**.
  - **Los talleres suspendidos se bloquean** y no se pueden elegir.
- Desglose del resultado en formato ficha y cartel fijo: *"Esta simulación es una estimación orientativa. Los importes pueden cambiar por decisión de la comisión de la biblioteca."*
- Botón "Cargar ejemplo de Norma (Jubilada)" para ver un caso listo.

### Persistencia en localStorage
- Guarda las **últimas 3 simulaciones** bajo la clave única `tintero_viajero_simulaciones_v1`.
- La **semilla inicial se carga solo en la primera visita**; si después la lista queda vacía (`[]`), se respeta.
- **Manejo seguro de errores**: solo se informa éxito si `setItem` no falló, y si falla nunca se altera lo que la persona tenía seleccionado.
- Desde el historial se puede **Cargar** o **Borrar** cada simulación.

### Compartir por WhatsApp
- Botón **"Compartir por WhatsApp"** en el resultado y en cada ficha del historial.
- Arma un resumen con el desglose y cierra con: *"Estimación orientativa. Los importes pueden cambiar por decisión de la comisión."*

## 3. Identidad visual · "Ficha de biblioteca"

| Uso | Color |
|---|---|
| Primario | `#23395D` |
| Fondo | `#F4EDE0` |
| Acento | `#E23A3A` |
| Texto secundario / bordes de ficha | `#6E7F5A` |
| Texto principal | `#1E1E1E` |
| Tarjetas | `#FFFFFF` |

Tipografías:
- **Merriweather** para títulos.
- **Atkinson Hyperlegible** para textos, números y tablas (pensada para lectura fácil de personas mayores).

Criterios: letra grande, textos cortos y vecinales, importes en pesos argentinos con formato `$3.500`, botones táctiles de al menos 44 px y sin desborde horizontal en pantallas de 360 px.

## 4. Stack tecnológico

- **React** (a través de Next.js, App Router) con TypeScript.
- **Tailwind CSS** para los estilos.
- **localStorage** del navegador para el historial del simulador.
- Los aranceles se guardan en una tabla SQLite (`aranceles`) cargada por migración, y se leen desde el servidor.

## 5. Instalación y ejecución local

Requisitos: Node 22 y npm.

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:3100
npm run build    # compilación de producción
```

Si hace falta preparar la base local: `npm run db:migrate`.

## 6. Caso de prueba verificado

**Socio jubilado + Encuadernación artesanal, a 6 meses = $61.980 ARS**

| Paso | Cuenta | Resultado |
|---|---|---|
| Cuota social (jubilado) | $1.800 × 6 meses | $10.800 |
| Descuento semestral 15% (solo cuota) | $10.800 − 15% | **$9.180** |
| Taller Encuadernación artesanal | $11.000 por mes | $11.000 |
| Descuento de socio 20% en taller | $11.000 − 20% | $8.800 por mes |
| Taller a 6 meses | $8.800 × 6 | **$52.800** |
| **Total semestral** | $9.180 + $52.800 | **$61.980** |

Referencia mensual sin el descuento semestral: $1.800 + $8.800 = **$10.600 por mes**.

## 7. Nota de privacidad

Todos los importes, estados, cupos y horarios son **datos sintéticos de prueba**: no representan tarifas oficiales de la biblioteca. La app no pide datos personales, no tiene cuentas y no procesa pagos; lo único que se guarda es el historial de simulaciones, en el propio navegador de cada persona.

## 8. Próximos pasos posibles

- Reemplazar los datos de prueba por las tarifas reales que apruebe la comisión.
- Agregar logo, dirección y teléfono en el pie.
- Sumar más servicios al simulador.
