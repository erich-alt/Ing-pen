# Finanzas Pro V2 en internet

Objetivo: publicar la app para usarla desde computador e iPhone sin mantener el PC prendido.

## Opcion recomendada: Cloudflare Pages

1. Sube este proyecto a GitHub.
2. En Cloudflare, crea un proyecto de Pages conectado al repositorio.
3. Configuracion de build:
   - Framework preset: None
   - Build command: dejar vacio
   - Output directory: `/`
4. En Settings > Environment variables agrega:
   - `WALLET_API_TOKEN`
   - Valor: tu token API de Wallet/BudgetBakers
5. Deploy.
6. Abre la URL HTTPS de Cloudflare Pages en Safari del iPhone.
7. En Safari: Compartir > Agregar a pantalla de inicio.

## Como sincroniza

La app llama a:

```text
/api/wallet/sync
```

En local lo atiende `server-v2.mjs`. En internet lo atiende:

```text
functions/api/wallet/sync.js
```

El token no queda en el HTML ni en el navegador. Cloudflare lo inyecta como secreto del backend.

## Importante

Los datos manuales que ingreses en un dispositivo quedan en ese navegador, salvo que vengan desde Wallet. Para compartir tambien datos manuales entre iPhone y computador, el siguiente paso es agregar una base cloud pequena, por ejemplo Cloudflare D1 o KV.
