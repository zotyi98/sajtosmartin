# Firebase beállítás — lépésről lépésre

A játék **felhasználónév + jelszóval** működik. **Nem kell email**, és **nem kell** bekapcsolni a Firebase Authentication (Email/Password) funkciót.

Projekt neve a kódban: **martinbikycle**

---

## 0. Bejelentkezés a Firebase-be

1. Nyisd meg böngészőben: **https://console.firebase.google.com/**
2. Jelentkezz be ugyanazzal a Google-fiókkal, amivel a projektet létrehoztad.
3. A főoldalon kattints a **martinbikycle** projektre (ha nem látod, görgess vagy használd a keresőt).

---

## 1. Realtime Database — létezik-e már?

1. Bal oldali menü: **Build** (építés ikon) → **Realtime Database**
2. Két eset lehetséges:

### A) Már van adatbázis (látod a „Data” fület és fa struktúrát)

- Ugorj a **2. lépésre** (Rules).

### B) Még nincs adatbázis („Create Database” gomb)

1. Kattints: **Create Database**
2. **Location (régió):** válaszd az **europe-west1** (Belgium) — a kód is erre van állítva  
   - Ha más régiót választasz, a `databaseURL` a kódban is változzon (ezt inkább ne tedd, ha nem értesz hozzá).
3. **Security rules:** válaszd a **Start in test mode**-ot *csak ideiglenesen* (később úgyis felülírjuk a saját rules-szel).
4. **Enable** / **Create** — várj, amíg létrejön.

---

## 2. Database Rules (szabályok) — KÖTELEZŐ

Ez a legfontosabb lépés. Enélkül belépés/mentés **`PERMISSION_DENIED`** hibát ad.

1. **Realtime Database** oldalon felül válaszd a **Rules** fület (a „Data” mellett).
2. A szerkesztőben **töröld ki** az egész régi szöveget.
3. Nyisd meg a számítógépeden a játék mappájában ezt a fájlt:  
   **`database.rules.json`**
4. **Másold ki az egész tartalmat** (a `{` -től a `}` -ig mindent).
5. **Illeszd be** a Firebase Rules szerkesztőbe.
6. Jobb felső sarok: **Publish** (Közzététel).
7. Erősítsd meg: **Publish** a felugró ablakban is.

### Mit csinálnak ezek a szabályok (röviden)?

| Útvonal | Jelentés |
|---------|----------|
| `accounts/{név}` | Jelszó hash — új fiók csak egyszer hozható létre |
| `sessions/{név}` | Belépéskor generált token — a mentés csak ezzel írható |
| `users/{név}/game` | Mentés tokennel; **törlés** (`null`) admin resethez engedélyezett |
| `leaderboard/{név}` | Ugyanígy — token vagy törlés; a teljes rangsor fa is törölhető |
| `config/admins` | Ki az admin — csak te állítod Console-ból |
| `admin/reset`, `admin/updateSignal` | Szerver reset / frissítés jelzés |

> **Fontos:** Ha a Rules-ben marad a régi, túl laza szabály (pl. mindenre `.read: true, .write: true` a gyökéren), vagy az Auth-hoz kötött régi verzió, a játék nem fog megfelelően működni.

---

## 3. Authentication — MIT NEM KELL CSINÁLNI

Sokan itt keresnek email bejelentkezést — **neked nem kell**.

1. Bal menü: **Build** → **Authentication**
2. **Nem kell** Enable-elni az Email/Password-öt.
3. Ha korábban bekapcsoltad tesztből, az sem baj — a játék most **nem használja**, csak zavaró lehet feleslegesen.

---

## 4. Admin jogosultság beállítása (a te fiókod)

Az admin panel a játékban: **Ctrl + Shift + L**  
Ez csak akkor működik, ha az adatbázisban beállítottad az admin nevet.

### Lépések

1. **Realtime Database** → **Data** fül (nem Rules!).
2. A fában lehet, hogy csak `(null)` vagy régi `users` adat látszik — mindegy.
3. Ha nincs `config` mappa:
   - Vigyük az egeret a gyökér fölé (a legfelső sor, gyakran a projekt URL-je vagy üres gyökér).
   - Kattints a **+** (Add child) ikonra.
   - **Name:** `config` → **Add**.
4. Kattints a `config` melletti **+**-ra:
   - **Name:** `admins` → **Add**.
5. Kattints az `admins` melletti **+**-ra:
   - **Name:** a **játékbeli felhasználóneved kisbetűvel**, szóköz nélkül  
     - Példa: ha `Zotyi` néven lépsz be → írd be: **`zotyi`**  
     - A kód a nevet kisbetűsítve kezeli (`Martin` → `martin`).
   - **Value / Type:** válaszd: **boolean** → érték: **`true`**
   - **Add** / **Save**.

### Végeredmény a fában

```
(config)
  └── admins
        └── zotyi: true
```

6. Frissítsd a játék oldalt, lépj be `zotyi` (vagy a te neved) + jelszóval.
7. Nyomd meg: **Ctrl + Shift + L** — meg kell jelennie az admin panelnek.

> **Megjegyzés:** A `config/admins` csomópontot a Rules **nem engedi** a játékból módosítani (szándékosan). Csak te, a Console-ban állíthatod be.

---

## 5. Régi játékosok / mentések

Ha korábban már voltak adatok a `users` alatt (pl. `users/Martin`, `users/zotyi`):

- **Nem kell** törölni őket a Console-ban.
- Első belépéskor ugyanazzal a **név + jelszó** párossal:
  - a játék ellenőrzi a régi jelszót,
  - létrehozza az új `accounts/{név}` hash-t,
  - betölti a régi mentést az új `users/{név}/game` alá.

Ha valaki **új nevet** vesz fel, az új fiók üresen indul.

---

## 6. Játék tesztelése böngészőből

### A) Fájlból (helyi)

1. Nyisd meg a mappában az **`index.html`**-t (dupla kattintás vagy Live Server).
2. Felhasználónév + jelszó → **BELÉPÉS**.
3. Vásárolj valamit, várj ~5 mp-et (automatikus mentés).
4. Firebase Console → **Realtime Database** → **Data**:
   - meg kell jelennie: `users` → `{a-neved}` → `game`
   - és: `leaderboard` → `{a-neved}`

### B) Firebase Hostingon (ha már feltöltötted)

1. Console → **Build** → **Hosting**
2. Ha van aktív oldal, azt nyisd meg (pl. `https://martinbikycle.web.app`).
3. Ugyanaz a belépés és ellenőrzés.

---

## 7. (Opcionális) API kulcs korlátozása

Nem kötelező baráti játéknál, de ajánlott, ha nyilvános az oldal.

1. Nyisd meg: **https://console.cloud.google.com/**
2. Válaszd ki ugyanazt a projektet: **martinbikycle**
3. **APIs & Services** → **Credentials**
4. Keresd a **Browser key** sort (Firebase-hez tartozó API kulcs).
5. Szerkesztés → **Application restrictions** → **HTTP referrers**
6. Add hozzá:
   - `https://martinbikycle.web.app/*`
   - `https://martinbikycle.firebaseapp.com/*`
   - `http://localhost/*` (helyi teszthez)
7. **Save**

---

## 8. Ellenőrző lista — minden kész?

Másold ki, és pipáld végig:

- [ ] Be vagyok lépve a Firebase Console-ba, **martinbikycle** projekt
- [ ] Van **Realtime Database** (europe-west1)
- [ ] **Rules** fülön a `database.rules.json` tartalma **Publish**-olva van
- [ ] **Authentication Email/Password NINCS** bekötve (nem baj, ha van, de nem kell)
- [ ] **Data** fülön: `config` → `admins` → `{a-te-neved}` = `true`
- [ ] Játékban belépés név + jelszóval működik
- [ ] Mentés után látom a `users/.../game` és `leaderboard/...` node-okat
- [ ] **Ctrl+Shift+L** admin panel megnyílik (ha admin vagy)

---

## 9. Gyakori hibák

### `PERMISSION_DENIED` belépéskor vagy mentéskor

| Ok | Megoldás |
|----|----------|
| Rules nincs publisholva | Ismételd meg a 2. lépést, **Publish** |
| Rossz / régi rules van bent | Teljes `database.rules.json` bemásolása |
| Nincs internet | Ellenőrizd a kapcsolatot |

### „Hibás jelszó”, pedig jó lenne

- Minimum **3 karakter** a jelszónak az új rendszerben.
- A név csak **betű, szám, _** (ékezet nélkül a rendszer kisbetűsít).
- Régi fiók: pontosan ugyanaz a jelszó, mint régen.
- Ha közben új fiók jött létre más jelszóval, a régi mentés más név alatt maradt.

### Admin panel nem nyílik

- `config/admins/{név}` = **`true`** (boolean, nem string `"true"`).
- A név **kisbetűs** legyen (`zotyi`, nem `Zotyi`).
- Lépj be ugyanazzal a névvel, majd **Ctrl+Shift+L**.

### Rangsor üres

- Először lépj be és játsz egy kicsit — mentés után töltődik a `leaderboard`.
- Rules-ben a `leaderboard` olvasása engedélyezett legyen (a json-ban `.read: true`).

### „Új fiók létrehozva”, de üres a mentés

- Normális teljesen új névnél.
- Ha régi mentést vársz: a névnek egyeznie kell a régi felhasználónévvel.

---

## 10. Adatstruktúra (ha a Data fülön böngészel)

Sikeres játék után kb. így néz ki:

```
accounts
  └── zotyi
        ├── passwordHash: "..."
        ├── salt: "..."
        └── createdAt: 1234567890

users
  └── zotyi
        └── game
              ├── bikes: ...
              ├── bps: ...
              └── upgrades: ...

leaderboard
  └── zotyi
        ├── displayName: "zotyi"
        ├── bps: ...
        └── prestigeCount: ...

config
  └── admins
        └── zotyi: true
```

---

## Összefoglalva — 3 kötelező lépés

1. **Realtime Database → Rules** → `database.rules.json` bemásolása → **Publish**
2. **Realtime Database → Data** → `config/admins/{neved}` = **true**
3. Játékban **belépés** név + jelszóval → teszt mentés

Ennyi. Email, Authentication, fizetős csomag **nem kell** ehhez.
