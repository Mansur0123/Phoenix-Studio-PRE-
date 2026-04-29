# Phoenix – Setup-Anleitung

Komplettes Setup für Watchlist + Google Login + MySQL-Datenbank.

---

## 1. MySQL-Datenbank einrichten

1. **MySQL Workbench** öffnen und mit deinem MySQL-Server verbinden.
2. Die Datei `database.sql` (im Root-Ordner) öffnen.
3. Komplett ausführen (⚡ Blitz-Symbol oben oder `Ctrl+Shift+Enter`).
4. Links sollte jetzt die Datenbank **`phoenix`** erscheinen mit den Tabellen
   `users`, `watchlists`, `watchlist_items`, `reviews`.

> **Achtung:** Das Script droppt die Datenbank `phoenix` falls sie existiert.
> Wenn du den Namen ändern willst, passe ihn in `database.sql` UND in `backend/.env` an.

---

## 2. Google OAuth Credentials erstellen — OPTIONAL

> **Du kannst diesen Schritt überspringen.** Die App hat auch normale
> Email/Passwort-Registrierung. Wenn du nur das verwenden willst, lass
> die `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET` in der `.env` einfach
> wie in der Vorlage stehen — der Google-Button erscheint dann gar nicht.

Wenn du Google-Login auch nutzen willst:

1. Geh zu **https://console.cloud.google.com**
2. Oben links → **Neues Projekt erstellen** (z.B. „Phoenix Studio")
3. Im Suchfeld oben: **„OAuth-Zustimmungsbildschirm"** suchen → öffnen
   - Nutzertyp: **Extern** wählen → Erstellen
   - App-Name: `Phoenix`
   - Support-Email: deine eigene
   - Speichern und weiter (alle Optional-Felder kannst du leer lassen)
   - Bei „Testnutzer" deine eigene Gmail-Adresse hinzufügen
4. Im Suchfeld: **„Anmeldedaten"** suchen → öffnen
5. Oben **„+ Anmeldedaten erstellen"** → **OAuth-Client-ID**
   - Anwendungstyp: **Webanwendung**
   - Name: `Phoenix Local`
   - **Autorisierte Weiterleitungs-URIs**: `http://localhost:3000/auth/google/callback`
   - Erstellen
6. Du bekommst eine **Client-ID** und ein **Client-Secret** angezeigt – beides kopieren.

---

## 3. Backend einrichten

```bash
cd backend
npm install
```

Dann `.env.example` nach `.env` kopieren:

```bash
# Windows (PowerShell)
copy .env.example .env

# oder einfach in Explorer kopieren und umbenennen
```

`backend/.env` öffnen und folgende Werte eintragen:

| Variable | Was |
|---|---|
| `DB_PASSWORD` | dein MySQL-Passwort |
| `DB_USER` | meist `root` |
| `SESSION_SECRET` | irgendeinen langen zufälligen String |
| `GOOGLE_CLIENT_ID` | aus Schritt 2 |
| `GOOGLE_CLIENT_SECRET` | aus Schritt 2 |

---

## 4. Backend starten

```bash
cd backend
npm start
```

Du solltest sehen:
```
✦ Phoenix Backend läuft auf http://localhost:3000
✦ Frontend erwartet auf http://localhost:5500
```

---

## 5. Frontend starten

Das Frontend ist statisches HTML/JS. Du brauchst nur einen lokalen Webserver,
der die `Project`-Dateien ausliefert.

**Einfachste Variante:** VS Code → Erweiterung **„Live Server"** installieren →
Rechtsklick auf `Project/index.html` → **„Open with Live Server"**.

Standardmäßig läuft der Live Server auf `http://localhost:5500` (oder `:5501`) –
das passt zur `FRONTEND_URL` in der `.env`.

> Falls dein Live Server auf einem anderen Port läuft, passe `FRONTEND_URL`
> in `backend/.env` an UND füge die URL in den Google OAuth „Autorisierten
> Weiterleitungs-URIs" hinzu (Schritt 2).

---

## 6. Testen

1. `http://localhost:5500/Project/index.html` (oder wo dein Live Server liegt) öffnen
2. Oben rechts auf **„🔐 Anmelden"** klicken → Google-Login
3. Nach Login: Avatar oben rechts, Klick auf einen Film → Modal → **„🔖 Zur Watchlist hinzufügen"**
4. Auf **„🔖 Watchlist"** klicken um deine Listen zu sehen, neue zu erstellen, umzubenennen, zu löschen

---

## Troubleshooting

**"redirect_uri_mismatch" beim Login:**
Die Redirect-URI in der Google Cloud Console muss EXAKT mit `GOOGLE_CALLBACK_URL`
in `.env` übereinstimmen. Inklusive `http://` und ohne Trailing-Slash.

**"ER_ACCESS_DENIED_ERROR" beim Backend-Start:**
Falsches MySQL-Passwort/User in `.env`.

**"CORS error" im Browser:**
`FRONTEND_URL` in `.env` muss exakt mit der URL deines Live Servers übereinstimmen
(inkl. Port). Backend nach Änderung neu starten.

**Cookie wird nicht gesetzt:**
Frontend und Backend müssen beide auf `localhost` laufen (nicht `127.0.0.1` für
das eine und `localhost` für das andere).

---

## Projektstruktur

```
Phoenix-Studio-PRE-/
├── database.sql              ← MySQL-Script (in Workbench ausführen)
├── SETUP.md                  ← diese Anleitung
├── backend/                  ← Node.js Server
│   ├── server.js
│   ├── auth.js               ← Google OAuth
│   ├── db.js                 ← MySQL-Verbindung
│   ├── routes/watchlists.js  ← API-Endpoints
│   ├── package.json
│   └── .env                  ← deine Secrets (NICHT committen!)
└── Project/                  ← Frontend
    ├── index.html
    ├── watchlist.html        ← neue Watchlist-Seite
    ├── auth.js               ← Login-State im Frontend
    ├── watchlist.js          ← Watchlist-API-Calls
    ├── watchlist-page.js     ← Logik für watchlist.html
    ├── main.js, modal.js, ...
    └── style.css
```
