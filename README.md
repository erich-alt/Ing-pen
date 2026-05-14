# Ing-pen

Prototipo navegable de una aplicacion chilena para gestion y pago de pensiones de alimentos.

## Abrir la app

- App publica: https://erich-alt.github.io/Ing-pen/
- Vista avanzada: https://erich-alt.github.io/Ing-pen/v2-wallet.html
- Repositorio: https://github.com/erich-alt/Ing-pen

## Que incluye

- Perfil del alimentante con monto mensual, historial de pagos y deuda.
- Simulacion de valores en CLP, UTM, UF e IPC.
- Flujo de pagos con opciones tipo Khipu, Webpay u otros medios.
- Carga de comprobantes para pagos ya realizados.
- Vista conceptual para tribunal, conciliacion bancaria y seguimiento de morosidad.
- Vista conceptual para receptor o beneficiario con notificaciones y registro historico.
- Soporte PWA para abrir desde celular e instalar en pantalla de inicio.

## Privacidad

Este prototipo guarda datos de prueba en el navegador. No debe usarse aun con datos reales, causas judiciales reales ni comprobantes sensibles sin implementar autenticacion, cifrado, permisos por rol, auditoria y tratamiento legal de datos personales.

## Archivos principales

- `index.html`: app principal.
- `v2-wallet.html`: cargador de la version avanzada.
- `v2-stage*.js`: modulos progresivos de funcionalidades.
- `manifest.webmanifest`: configuracion PWA.
- `sw.js`: cache offline.
- `vendor/`: librerias locales para Excel y PDF.
