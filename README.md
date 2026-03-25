# UsablOS
A web based OS, which is also a usable cloud machine! Made for one of my hack club projects!


## For Voters / Shipwrights

Please open the cloud instance of the os, and use the following credentials to log into the demo account.

Cloud OS Link: https://usabl.thehytalehost.com

Username: `admin`

Password: `admin`


## How Usabl works

UsablOS is a cloud based OS, in which you can use its apps to work on it. It uses socket.io to sync data between the client and the server.

## Multi Session Sync
Usabl has a very strong feature, where if 2 different users log in from same account at the same time, they can see each other's cursors, and work together on the same os and at the same time!


## Ability for Expansion and Future Growth

Usabl would be moulded into an OS, which is cloud based, but users can install apps in it, like they do with their phones or computers. Developers can make their own apps, and upon adding those to the components, they can add them to the os, and users can use them!

## Features

- Multi-window desktop environment with drag, resize, minimize, maximize and all kinds of stuff which an OS could have
- Realtime session sync across tabs/devices/people!
- Proper file system, with Folders, Text files, Images and more
- Apps: Notepad, Paint, Calculator, File Explorer, Settings, and more!
- Themes: Glass, Dark, Midnight, Aero, Light and more!
- Screensavers, Wallpapers, Brightness & Volume, Desktop Customization
- Calendar, Action Center, Start Menu, Taskbar

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### 1. Install Dependencies

```bash
npm install
cd server && npm install && cd ..
```

### 2. Set up the Database

```bash
cd server
npx prisma generate
npx prisma db push
cd ..
```

### 3. Configure Environment

```bash
cp .env.example .env
# Open .env and set it up, set the JWT_SECRET to a proper random string.
```
### Build

```bash
npm run build:all
```

### Run

```bash
npm start
```

This starts the Express server in production mode at:

> **http://localhost:5174**

## WEBOS ACHIEVEMENT 
This project is submitted for Web OS achievement for hack club.

## 📝 License

MIT
