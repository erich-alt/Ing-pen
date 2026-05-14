# Finanzas v3

Versión integrada de Finanzas + Ingresos/Pensión + Importación.

## Enlace de prueba

`https://erich-alt.github.io/Ing-pen/finanzas-v3/`

## Módulos

- Panel
- Registros
- Cuentas
- Categorías
- Vehículo
- Planificar
- Deudas
- Ingresos
- Impuestos
- Importar
- Datos

## Importación

Soporta, en forma inicial:

- Excel `.xlsx` / `.xls`
- CSV
- PDF con texto interno

Tipos de importación:

- Movimientos / cartola
- Liquidación de sueldo o bono
- Comprobante pago pensión
- Detección automática

## Importante

- Los datos se guardan localmente en el navegador.
- El código está en GitHub, pero los datos importados no se suben a GitHub.
- Si un PDF es una foto o escaneo, esta versión no podrá leerlo sin OCR.
- La lectura automática es heurística: primero muestra vista previa antes de guardar.

## Próximas mejoras sugeridas

1. Agregar reglas de clasificación masiva.
2. Agregar importación específica por formato de bancos chilenos.
3. Agregar parser específico para liquidaciones de sueldo según formato real.
4. Agregar OCR para PDFs escaneados.
5. Unificar esta versión con la app principal PWA final.
