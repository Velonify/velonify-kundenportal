# Velonify Kundenportal

Das Portal für Kunden von Velonify unter **https://kunden.velonify.de**. Kunden melden sich per Link aus einer Mail an (ohne Passwort) und sehen nur, was im Velonify Hub für sie freigegeben ist:

- **Start:** Für dich zu tun (Freigaben mit einem Klick, mit Rückgängig), Projektstand aus dem Fahrplan, Was neu ist
- **Projekt:** alle sichtbaren Karten als Liste (Wartet auf dich · In Arbeit · Als Nächstes · Erledigt), Details mit Gespräch
- **Dateien:** `07_Client-Share` im Kundenordner, Upload nach `07_Client-Share/Vom Kunden` (bis 25 MB)
- **Werkzeuge:** freigeschaltete Kunden-Werkzeuge (UTM-Generator) und die Links des Kunden
- **Neue Anfrage:** wird eine Karte auf dem Kunden-Board, mit Anhängen und „Dringend“

Im Repo liegen keine Kundendaten. Alles kommt nach dem Login von der Cloud Function `kundenportal` (Repo [Velonify/velonify-crm](https://github.com/Velonify/velonify-crm), `functions/kundenportal`). Der API-Vertrag steht in `src/api/vertrag.ts`, eine Kopie von `src/data/portalApi.ts` im Hub. Wer ihn ändert, ändert beide Seiten.

## Lokal

```bash
npm install
npm run dev     # http://localhost:5199
npm test
```

Ohne `VITE_PORTAL_API_URL` läuft das Portal als **Demo** mit einem erfundenen Kunden (`src/api/demo.ts`). Gegen die echte Function: `.env.local` mit `VITE_PORTAL_API_URL=https://…` anlegen. `http://localhost:5199` muss dafür in `WEITERE_ORIGINS` der Function stehen.

## Veröffentlichung

GitHub Pages über `.github/workflows/pages.yml` bei jedem Push auf `main`. Einmalig einzurichten:

1. Repo → Settings → Secrets and variables → Actions → **Variables**: `PORTAL_API_URL` = Adresse der Function (ohne `/` am Ende).
2. Repo → Settings → Pages: Source „GitHub Actions“, Custom domain `kunden.velonify.de`, HTTPS erzwingen.
3. DNS bei Strato: `CNAME kunden → velonify.github.io`.
4. In der Function steht `PORTAL_URL=https://kunden.velonify.de`. Daraus baut sie den Link in der Login-Mail (`/#/anmelden/<token>`) und erlaubt diese Adresse für CORS.

## Aufbau

- `src/App.tsx`: Anmeldung, Link einlösen, Laden
- `src/portal.tsx`: Daten und Aktionen (Freigabe mit 5 Sekunden Rückgängig, Download, Fehler, Abmelden bei 401)
- `src/Shell.tsx`: Leiste (am Handy unten), Seiten, Seitenblätter
- `src/seiten/*`: Seiten und Seitenblätter
- `src/lib/*`: Routen (Hash, wegen GitHub Pages), Datum (Europe/Berlin), Feed, UTM
- `src/konfig.ts`: Kontakt, Notfallnummer, Rechtliches, Kunden-Werkzeuge
