# MotoGP Social Hub

Socijalna mreža za MotoGP navijače — SPA izrađena u Node.js + Express + MySQL.

## Pokretanje projekta

### 1. Instaliraj XAMPP
Preuzmi s https://www.apachefriends.org i pokreni **Apache** i **MySQL** u XAMPP Control Panelu.

### 2. Kreiraj bazu podataka
Otvori **phpMyAdmin** (http://localhost/phpmyadmin), klikni **SQL** i zalijepi sadržaj fajla `db/schema.sql`, zatim klikni **Go**.

### 3. Instaliraj Node.js pakete
```
npm install
```

### 4. Pokreni server
```
npm start
```

Otvori http://localhost:3000

---

## Test korisnici

| Uloga  | Username         | Password   |
|--------|-----------------|------------|
| Admin  | admin           | admin123   |
| Vozač  | marc_marquez    | motogp123  |
| Fan    | speedfreak99    | fan123     |

---

## Struktura projekta

```
motogp-hub/
├── db/
│   ├── database.js      ← MySQL konekcija i seed podataka
│   └── schema.sql       ← SQL za kreiranje tablica
├── routes/
│   ├── auth.js          ← Register, login, /me
│   ├── posts.js         ← Feed, komentari, glasanje, admin
│   ├── users.js         ← Profili, driveri, follow/unfollow
│   ├── live.js          ← Live chat diskusija
│   └── auth.middleware.js
├── public/
│   ├── index.html       ← SPA
│   ├── references.html  ← Popis izvora
│   ├── css/style.css
│   └── js/              ← Frontend moduli
└── server.js            ← Express server
```
