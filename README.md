# MotoGP Social Hub

Socijalna mreža za MotoGP navijače izrađena u Node.js + Express + MySQL.

 **Live:** hostano na [Renderu](https://motogphub-c0wg.onrender.com)

---

## Tehnologije

- **Backend:** Node.js, Express
- **Baza:** MySQL (udaljena, SSL/TLS konekcija)
- **Auth:** JWT + bcryptjs
- **Frontend:** Vanilla JS SPA (bez frameworka)

---

## Test korisnici

| Uloga  | Username      | Password   |
|--------|---------------|------------|
| Admin  | admin         | admin123   |
| Vozač  | marc_marquez  | motogp123  |
| Fan    | speedfreak99  | fan123     |

> Svi vozači koriste lozinku `motogp123`, svi fanovi `fan123`. Cijeli popis vozača i fanova nalazi se u `db/database.js`.

---

## Struktura projekta

```
MotoGPHub/
├── db/
│   ├── ca.pem           ← SSL CA certifikat za MySQL
│   ├── database.js      ← MySQL pool, query helper, seed
│   └── schema.sql       ← SQL za kreiranje tablica
├── routes/
│   ├── auth.js              ← Register, login, /me
│   ├── auth.middleware.js   ← JWT provjera
│   ├── posts.js             ← Feed, komentari, glasanje, admin moderacija
│   ├── users.js             ← Profili, vozači, follow/unfollow
│   └── live.js              ← Live chat diskusije
├── public/
│   ├── index.html       ← SPA shell
│   ├── references.html  ← Popis izvora
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js       ← Fetch wrapper
│       ├── app.js       ← Glavni router / init
│       ├── auth.js      ← Login / register UI
│       ├── posts.js     ← Feed i postovi
│       ├── drivers.js   ← Lista vozača
│       ├── teams.js     ← Lista timova
│       ├── calendar.js  ← MotoGP kalendar
│       ├── live.js      ← Live chat
│       └── admin.js     ← Admin panel
├── server.js            ← Express server, statički files, route mounting
├── package.json
└── README.md
```

---

## API rute (pregled)

- `POST /api/auth/register` – registracija fana
- `POST /api/auth/login` – login
- `GET  /api/auth/me` – trenutni user (zahtijeva JWT)
- `GET  /api/posts` – feed
- `POST /api/posts` – novi post (status `pending` dok admin ne odobri)
- `POST /api/posts/:id/vote` – like / dislike
- `GET  /api/users/:username` – profil
- `POST /api/users/:username/follow` – follow / unfollow
- `GET  /api/live` – aktivne diskusije i poruke

Detalji u `routes/*.js`.
