# Handleiding: Daydrinking Royale Online Zetten 🚀

Deze handleiding helpt u om uw game **Daydrinking Royale** gratis online te zetten, zodat u deze direct op uw mobiel (en met vrienden) kunt spelen zonder dat uw laptop aan hoeft te blijven staan.

---

## 🛠️ Stap 1: Uw code op GitHub zetten
Om online te kunnen publiceren, is het handig om de code in een (gratis) GitHub-repository te zetten. Dit maakt het ook heel makkelijk om offline wijzigingen door te voeren en direct online te zetten!

1. Ga naar [github.com](https://github.com) en log in of maak een gratis account aan.
2. Klik op **New** (Nieuw) om een nieuwe repository aan te maken:
   - **Repository name**: `daydrinking-royale` (of een naam naar keuze).
   - **Public/Private**: Kies **Private** (Privé) als u de code geheim wilt houden, of **Public** als iedereen het mag zien.
3. Volg de stappen op het scherm om uw lokale map `lively-einstein` te uploaden naar deze GitHub repository. 
   *(Als u hulp nodig heeft met Git commando's om dit te doen, laat het mij gerust weten!)*

---

## ☁️ Stap 2: De Backend online zetten via Render (Gratis)
De backend zorgt voor de multiplayer-verbindingen (WebSockets). Render is een uitstekend en gratis platform hiervoor.

1. Ga naar [render.com](https://render.com) en maak een gratis account aan (u kunt inloggen met uw GitHub-account).
2. Klik op de knop **New +** en kies **Web Service**.
3. Selecteer uw GitHub-repository `daydrinking-royale` (u moet Render mogelijk eerst toestemming geven om uw repositories te lezen).
4. Vul de volgende instellingen in:
   - **Name**: `daydrinking-royale-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend` (belangrijk: dit vertelt Render dat de servercode in de `backend`-map zit!)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (Gratis)
5. Klik onderaan op **Deploy Web Service**.

*Binnen enkele minuten staat uw backend live! Render geeft u een URL die er ongeveer zo uitziet:*
`https://daydrinking-royale-backend.onrender.com`

---

## 📱 Stap 3: De Web Simulator online zetten (Gratis)
Nu de backend online staat, kunnen we de website (`web_simulator`) online zetten zodat u deze op uw telefoon kunt openen. Dit kan gratis via **Vercel**, **Netlify**, of **GitHub Pages**. **Vercel** is hiervoor het makkelijkst en snelst.

### Optie A: Via Vercel (Aanbevolen & Snelst)
1. Ga naar [vercel.com](https://vercel.com) en log in met uw GitHub-account.
2. Klik op **Add New...** -> **Project**.
3. Importeer uw repository `daydrinking-royale`.
4. Configureer de instellingen:
   - **Framework Preset**: Kies `Other` (of Vercel herkent het automatisch).
   - **Root Directory**: Selecteer `web_simulator`.
5. Klik op **Deploy**.

*Vercel geeft u nu een prachtige, snelle URL die u direct op uw mobiele telefoon kunt openen om de game te spelen!*

---

## 🔄 Hoe u offline kunt blijven werken en aanpassingen doet

U kunt nog steeds offline werken:
1. **Lokaal testen**: Open uw code lokaal op uw laptop. Start de backend lokaal (`npm run dev` in de map `backend`). Open de lokale `web_simulator/index.html`. Omdat de website op `localhost` draait, verbindt de game automatisch met uw lokale server.
2. **Wijzigingen online zetten**: Bent u tevreden met een offline aanpassing? 
   - Sla de bestanden op.
   - "Push" de wijzigingen naar GitHub.
   - Render en Vercel zien de nieuwe code en updaten uw online game binnen 1-2 minuten volledig automatisch!
