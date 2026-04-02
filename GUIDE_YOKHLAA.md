# Guide Yokh Laa — Tout comprendre sur ton app

## C'est quoi Yokh Laa ?

Yokh Laa c'est une app de transport comme Uber ou Yango, mais **faite pour Dakar** et avec un modele different :
- Les chauffeurs paient **18 500 FCFA/mois** (abonnement fixe)
- **0% de commission** sur les courses (le chauffeur garde tout)
- Les passagers paient en **especes, Wave ou Orange Money**

Le nom vient du wolof : "Yokh Laa" = "Aller la-bas"

---

## Comment ca marche ? (Le parcours utilisateur)

### Cote Passager

```
1. Ouvrir l'app
2. Se connecter avec son numero (+221...)
   → Recoit un code SMS (OTP) a 6 chiffres
   → Tape le code → connecte
3. Voit la carte de Dakar avec les chauffeurs en ligne (points verts)
4. Tape "Ou allez-vous ?" → cherche sa destination
   → Voit ses recherches recentes
   → Voit les lieux populaires (Aeroport, UCAD, Sandaga...)
   → Ou tape une adresse
5. Choisit la classe de vehicule :
   → Start (economique, -15%)
   → Confort (standard)
   → Premium (+50%)
6. Voit le prix, la distance, le temps estime
7. Choisit comment payer (Especes / Wave / Orange Money)
8. Appuie "Commander"
9. L'app cherche un chauffeur (max 3 min)
10. Chauffeur trouve !
    → Voit le nom, la note, le vehicule, la plaque
    → Peut appeler ou chatter avec le chauffeur
    → Peut partager sa course avec un proche
11. Le chauffeur arrive → monte → course en cours
12. Arrive a destination → course terminee
13. Note le chauffeur (1 a 5 etoiles + commentaire)
```

### Cote Chauffeur

```
1. Se connecter → choisir "Chauffeur"
2. Doit avoir un abonnement actif (18 500 FCFA/mois)
3. Passe en ligne (toggle ON)
   → L'app envoie sa position GPS toutes les 5 secondes
4. Recoit une notification "Nouvelle course !"
   → Voit le depart, la destination, le prix
   → Accepter ou refuser
5. Accepte → va chercher le passager
   → Peut chatter avec le passager
6. Arrive → appuie "Je suis arrive"
7. Passager monte → appuie "Demarrer la course"
8. Arrive a destination → appuie "Terminer"
9. Gagne le prix COMPLET (0% commission)
10. Peut voir son tableau de bord :
    → Gains du jour/semaine/mois
    → Nombre de courses
    → Note moyenne
    → Graphique des gains
```

---

## Les ecrans de l'app (17 au total)

| Ecran | C'est quoi | Qui le voit |
|-------|-----------|-------------|
| **Welcome** | Page d'accueil avec le logo | Tout le monde |
| **Login** | Connexion par SMS (+221) | Tout le monde |
| **RoleSelect** | Choisir passager ou chauffeur | Nouveaux users |
| **PassengerMap** | Carte + recherche + commande | Passagers |
| **Driver** | Mode chauffeur (carte + courses) | Chauffeurs |
| **DriverDashboard** | Stats et gains du chauffeur | Chauffeurs |
| **Activity** | Historique des courses | Passagers |
| **RideDetail** | Detail d'une course (recu, note) | Tous |
| **Chat** | Messages en direct passager/chauffeur | Pendant une course |
| **LiveTrack** | Suivi en direct (pour les proches) | Lien partage |
| **Profile** | Mon profil + parametres | Tous |
| **EditProfile** | Modifier nom, tel | Tous |
| **About** | A propos de Yokh Laa | Tous |
| **Help** | FAQ et aide | Tous |

---

## La base de donnees (ou sont stockees les infos)

Imagine des tableaux Excel en ligne. On utilise **Supabase** (comme une base de donnees en cloud).

### 5 "tableaux" :

**1. profiles** (les utilisateurs)
- Nom, telephone, role (passager ou chauffeur)
- Position GPS, note moyenne
- Vehicule et plaque (chauffeurs)
- Adresses maison/travail sauvegardees

**2. rides** (les courses)
- Qui est le passager, qui est le chauffeur
- Adresse depart → adresse arrivee
- Prix, distance, duree
- Statut : en attente → accepte → en route → en cours → termine

**3. messages** (le chat)
- Quel course, qui envoie, le message, lu ou pas

**4. subscriptions** (abonnements chauffeurs)
- Quel chauffeur, actif ou pas, date debut/fin, montant

**5. waitlist** (liste d'attente pre-lancement)
- Les gens qui se sont inscrits avant le lancement

---

## Le calcul du prix

```
Prix = 500 FCFA (base) + 400 FCFA x kilometres

Exemples :
- 3 km = 500 + 1200 = 1 700 FCFA
- 5 km = 500 + 2000 = 2 500 FCFA
- 10 km = 500 + 4000 = 4 500 FCFA
- 20 km = 500 + 8000 = 8 500 FCFA
```

Les classes modifient le prix :
- **Start** : prix x 0.85 (15% moins cher)
- **Confort** : prix normal
- **Premium** : prix x 1.50 (50% plus cher)

Quand il y a beaucoup de trafic (embouteillages), le prix peut augmenter de 10-30% (surge).

---

## Les notifications

L'app envoie des notifications push (comme WhatsApp) :

| Quand | Qui recoit | Message |
|-------|-----------|---------|
| Nouvelle course dispo | Chauffeurs en ligne | "Nouvelle course ! Medina → UCAD · 2 500 FCFA" |
| Chauffeur accepte | Passager | "Chauffeur trouve ! Mamadou est en route" |
| Chauffeur arrive | Passager | "Chauffeur arrive !" |
| Course demarre | Passager | "Course demarree — en route vers UCAD" |
| Course terminee | Passager | "Course terminee ! 2 500 FCFA" |
| Course annulee | Chauffeur/Passager | "Course annulee" |
| Nouveau message | L'autre personne | "Mamadou: Je suis en route" |

---

## La securite

- **Authentification SMS** : personne ne peut se connecter sans avoir le telephone
- **RLS (Row Level Security)** : chaque utilisateur ne peut voir QUE ses propres donnees
  - Un passager ne voit pas les courses des autres
  - Un chauffeur ne peut accepter que les courses en attente
  - Le chat n'est visible que par le passager et le chauffeur de la course
- **Bouton SOS** : appel direct au 17 (Police Senegal) pendant la course
- **Partage de course** : le passager peut envoyer un lien de suivi a un proche

---

## Technologies, outils et credentials (TOUT)

### 1. React Native + Expo (le moteur de l'app)

| Info | Valeur |
|------|--------|
| C'est quoi | Framework pour creer des apps iPhone + Android avec un seul code |
| Version Expo | **SDK 55** |
| Version React Native | **0.83.2** |
| Version React | **19.2.4** |
| Bundler web | Metro |
| Bundle ID iOS | `com.yokhlaa.app` |
| Package Android | `com.yokhlaa.app` |
| Orientation | Portrait uniquement |
| Theme | Dark mode uniquement |

**Commandes :**
```
npm start              → Lancer le serveur de dev
npx expo start --web   → Lancer en mode web (navigateur)
expo run:ios           → Lancer sur iPhone (besoin Xcode)
expo run:android       → Lancer sur Android (besoin Android Studio)
npx expo export --platform web → Verifier que le build marche
```

---

### 2. Supabase (la base de donnees + auth + temps reel)

C'est comme un serveur backend tout-en-un. Stocke les donnees, gere les connexions, envoie les mises a jour en direct.

| Info | Valeur |
|------|--------|
| C'est quoi | Backend-as-a-service (base de donnees PostgreSQL en cloud) |
| Dashboard | https://supabase.com/dashboard/project/oxzczrwsyvuavgevfhko |
| Project ID | `oxzczrwsyvuavgevfhko` |
| Region | (heberge par Supabase cloud) |
| API URL | `https://fpjyfctwjiivusbzxmrg.supabase.co` |
| Anon Key (cle publique) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94emN6cndzeXZ1YXZnZXZmaGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTczODgsImV4cCI6MjA4OTM3MzM4OH0.hS5JVKsl2hLBX6QBO5ig8AVZLOXvcNbQuJf389IAlD4` |
| Management API Token | `sbp_86d355262e243f345f1f2f89bf26340cfed3771e` |
| Pricing | Gratuit (plan Free) puis 25$/mois (plan Pro) |

**Pour executer du SQL sur la base :**
```bash
curl -s -X POST "https://api.supabase.com/v1/projects/oxzczrwsyvuavgevfhko/database/query" \
  -H "Authorization: Bearer sbp_86d355262e243f345f1f2f89bf26340cfed3771e" \
  -H "Content-Type: application/json" \
  -d '{"query": "TON SQL ICI"}'
```

**Fonctionnalites utilisees :**
- **Auth** → Connexion par SMS (OTP)
- **Database** → PostgreSQL (5 tables)
- **Realtime** → Mises a jour instantanees (position chauffeur, chat, statut course)
- **RLS** → Securite (chacun voit que ses donnees)
- **Edge Functions** → Envoi de SMS via Twilio
- **Storage** → Pas encore utilise (prevu pour photos profil)

---

### 3. TomTom (trafic routier en temps reel)

| Info | Valeur |
|------|--------|
| C'est quoi | API qui donne le trafic, les embouteillages et calcule les itineraires |
| Site | https://developer.tomtom.com |
| API Key | `9w6L2Sw8M8eOnAWzsnD4IyPhLF9ul3aV` |
| URL de base | `https://api.tomtom.com` |
| Plan gratuit | 2 500 requetes/jour |
| Utilise pour | Calcul ETA avec trafic, surge pricing, incidents routiers |

**Endpoints utilises :**
- `/routing/1/calculateRoute/...` → Calcul d'itineraire avec trafic
- `/traffic/services/5/incidentDetails` → Incidents sur la route

Si la cle TomTom ne marche plus ou quota depasse → l'app bascule automatiquement sur OSRM (gratuit, sans trafic).

---

### 4. OSRM (calcul d'itineraire gratuit)

| Info | Valeur |
|------|--------|
| C'est quoi | Moteur de calcul d'itineraire open-source |
| URL | `https://router.project-osrm.org` |
| Cle API | Aucune (gratuit et ouvert) |
| Utilise pour | Fallback si TomTom est indisponible, calcul distance/duree |

---

### 5. Nominatim / OpenStreetMap (recherche d'adresses)

| Info | Valeur |
|------|--------|
| C'est quoi | Service gratuit pour chercher des adresses et positions GPS |
| URL recherche | `https://nominatim.openstreetmap.org/search` |
| URL inverse | `https://nominatim.openstreetmap.org/reverse` |
| Cle API | Aucune (gratuit) |
| Header requis | `User-Agent: YokhLaa/1.0` |
| Zone | Limite au Senegal (countrycodes=sn, viewbox Dakar) |
| Utilise pour | Autocompletion d'adresses, geocodage inverse (GPS → adresse) |

---

### 6. Twilio (envoi de SMS)

| Info | Valeur |
|------|--------|
| C'est quoi | Service d'envoi de SMS dans le monde entier |
| Site | https://www.twilio.com |
| Account SID | Configure dans les variables Supabase Edge Functions |
| Auth Token | Configure dans les variables Supabase Edge Functions |
| Phone Number | Configure dans les variables Supabase Edge Functions |
| Prix par SMS (Senegal) | ~0.05$ (~30 FCFA) |
| Utilise pour | Codes de connexion OTP, notifications SMS de course |

**Comment configurer Twilio dans Supabase :**
1. Va sur https://supabase.com/dashboard/project/oxzczrwsyvuavgevfhko/settings/vault
2. Ou dans Edge Functions > Settings > Environment Variables
3. Ajoute :
   - `TWILIO_ACCOUNT_SID` = ton SID Twilio
   - `TWILIO_AUTH_TOKEN` = ton token Twilio
   - `TWILIO_PHONE_NUMBER` = ton numero Twilio (ex: +1234567890)

**Templates SMS :**
- OTP : "YokhLaa - Votre code de verification: 123456. Valable 5 minutes."
- Course acceptee : "YokhLaa - Mamadou a accepte votre course. Vehicule: Toyota (DK-1234). Il arrive dans ~5 min."
- Chauffeur arrive : "YokhLaa - Votre chauffeur est arrive au point de depart."
- Course terminee : "YokhLaa - Course terminee ! Montant: 2 500 FCFA."

---

### 7. Expo Push Notifications (notifications telephone)

| Info | Valeur |
|------|--------|
| C'est quoi | Service gratuit d'Expo pour envoyer des notifications push |
| URL | `https://exp.host/--/api/v2/push/send` |
| Cle API | Aucune (utilise le push token de chaque telephone) |
| Prix | Gratuit |
| Channels Android | `rides` (priorite MAX), `messages` (priorite HIGH) |

---

### 8. GitHub (stockage du code)

| Info | Valeur |
|------|--------|
| C'est quoi | Plateforme pour stocker et partager le code |
| Repo | https://github.com/mamadou-ba7/yokhlaa |
| Branche principale | `main` |
| Token d'acces | (stocke localement — ne jamais mettre dans le code) |

---

### 9. AsyncStorage (stockage local sur le telephone)

| Info | Valeur |
|------|--------|
| C'est quoi | Stockage de donnees sur le telephone (comme des cookies) |
| Package | `@react-native-async-storage/async-storage` |
| Utilise pour | Historique de recherche d'adresses (max 10 recentes) |
| Cle de stockage | `yokhlaa_search_history` |

---

### 10. Expo SecureStore (stockage securise)

| Info | Valeur |
|------|--------|
| C'est quoi | Stockage chiffre sur le telephone (comme un coffre-fort) |
| Package | `expo-secure-store` |
| Utilise pour | Token d'authentification Supabase (session de connexion) |

---

### 11. Expo Location (GPS)

| Info | Valeur |
|------|--------|
| C'est quoi | Acces a la position GPS du telephone |
| Package | `expo-location` |
| Permissions iOS | Location Always + When In Use |
| Permissions Android | ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION |
| Utilise pour | Position du passager, suivi GPS du chauffeur (toutes les 5 sec) |

---

### 12. Expo Haptics (vibrations)

| Info | Valeur |
|------|--------|
| C'est quoi | Vibrations du telephone pour le feedback tactile |
| Package | `expo-haptics` |
| Utilise pour | Vibration legere quand tu appuies un bouton, vibration forte quand le chauffeur accepte, etc. |
| Sur web | Desactive (pas de vibration sur navigateur) |

---

### 13. React Navigation (navigation entre ecrans)

| Info | Valeur |
|------|--------|
| C'est quoi | Systeme pour naviguer entre les pages de l'app |
| Package | `@react-navigation/native` + `native-stack` + `bottom-tabs` |
| Stack | Navigation principale (ecrans empiles) |
| Bottom Tabs | Barre du bas pour les passagers (Course / Activite / Profil) |
| Deep linking | `yokhlaa://track/{shareToken}` pour le suivi partage |

---

### 14. react-native-maps (carte)

| Info | Valeur |
|------|--------|
| C'est quoi | Composant de carte pour iOS/Android |
| Package | `react-native-maps` |
| Sur iOS/Android | Google Maps ou Apple Maps natif |
| Sur web | Leaflet + OpenStreetMap (tuiles gratuites) |
| Centre par defaut | Dakar (14.7167, -17.4677) |

---

### Tableau recapitulatif de tous les packages npm

| Package | Version | Role |
|---------|---------|------|
| expo | 55.0.5 | Framework principal |
| react | 19.2.4 | Interface utilisateur |
| react-native | 0.83.2 | App mobile |
| react-native-web | 0.21.2 | Version web |
| @supabase/supabase-js | 2.99.0 | Client base de donnees |
| @react-navigation/native | 7.1.33 | Navigation |
| @react-navigation/native-stack | 7.14.4 | Navigation stack |
| @react-navigation/bottom-tabs | 7.15.5 | Barre du bas |
| react-native-maps | 1.27.1 | Carte |
| react-native-reanimated | 4.2.1 | Animations fluides |
| react-native-screens | 4.24.0 | Ecrans natifs |
| react-native-safe-area-context | 5.7.0 | Zone safe (notch iPhone) |
| @react-native-async-storage/async-storage | 2.2.0 | Stockage local |
| @expo/vector-icons | 15.1.1 | Icones (Ionicons) |
| expo-location | 55.1.2 | GPS |
| expo-notifications | 55.0.12 | Notifications push |
| expo-haptics | 55.0.9 | Vibrations |
| expo-secure-store | 55.0.8 | Stockage securise |
| expo-device | 55.0.9 | Info appareil |
| expo-constants | 55.0.7 | Constantes Expo |
| expo-task-manager | 55.0.9 | Taches en arriere-plan |
| expo-status-bar | 55.0.4 | Barre de statut |
| expo-font | 55.0.4 | Polices |
| expo-linear-gradient | 55.0.8 | Degrades |
| react-native-url-polyfill | 3.0.0 | Compat URL pour Supabase |

---

### Fichiers de configuration importants

| Fichier | Role |
|---------|------|
| `app.json` | Configuration Expo (nom, icone, permissions, plugins) |
| `babel.config.js` | Config du compilateur (plugin reanimated) |
| `package.json` | Liste des packages + scripts |
| `supabase/config.toml` | Config Supabase locale (ports, auth, SMS) |
| `.gitignore` | Fichiers ignores par git (node_modules, .env, dist) |
| `CLAUDE.md` | Instructions pour Claude Code |
| `AGENTS.md` | Instructions pour Codex |

---

## Ton modele economique

```
REVENUS :
- 1 chauffeur = 18 500 FCFA / mois
- 100 chauffeurs = 1 850 000 FCFA / mois
- 500 chauffeurs = 9 250 000 FCFA / mois
- 1000 chauffeurs = 18 500 000 FCFA / mois

COUTS (estimations mensuelles) :
- Supabase (base de donnees) : 25$ (~15 000 FCFA) → gratuit au debut
- Twilio (SMS) : ~0.05$ par SMS (~30 FCFA)
- TomTom (trafic) : 2 500 requetes/jour gratuites
- Serveur : ~20$ (~12 000 FCFA) pour commencer
- Apple Developer : 99$/an (~60 000 FCFA/an)
- Google Play : 25$ une fois (~15 000 FCFA)
```

**Avantage vs Uber/Yango** : ils prennent 20-25% de commission. Toi tu prends 0%.
Un chauffeur qui fait 300 000 FCFA/mois paie 18 500 FCFA fixe (6%) au lieu de 60 000-75 000 FCFA.

---

## Ce qui est fait vs ce qui reste

### Fait (pret a tester)
- [x] Inscription/connexion par SMS
- [x] Carte de Dakar avec chauffeurs en temps reel
- [x] Recherche d'adresse avec historique
- [x] Commande de course (3 classes)
- [x] Matching chauffeur/passager en temps reel
- [x] Suivi GPS du chauffeur en direct
- [x] Chat in-app
- [x] Systeme de notation (etoiles + tags)
- [x] Historique des courses + detail/recu
- [x] Dashboard chauffeur (stats, gains, graphique)
- [x] Notifications push
- [x] Partage de course en direct
- [x] Calcul de prix avec trafic
- [x] Bouton SOS

### Reste a faire
- [ ] Ecran de paiement abonnement chauffeur (Wave/OM)
- [ ] Verification documents chauffeur (permis, carte grise)
- [ ] Dashboard admin (gerer les chauffeurs et courses)
- [ ] Publication sur App Store et Google Play
- [ ] Tests avec vrais utilisateurs a Dakar
- [ ] Conditions d'utilisation et politique de confidentialite
- [ ] Support client (WhatsApp ou chat)

---

## Comment tester l'app

### Sur ton telephone (le plus simple)
1. Installe **Expo Go** depuis l'App Store ou Google Play
2. Sur ton Mac, ouvre le terminal dans le dossier du projet
3. Tape `npm start`
4. Scanne le QR code avec ton telephone
5. L'app s'ouvre sur ton tel !

### Sur le navigateur web
1. Tape `npx expo start --web`
2. L'app s'ouvre dans Chrome (la carte sera en mode web)

---

## Comment deployer (publier l'app)

Quand tu es pret a publier :

**1. Apple App Store (iPhone)**
- Faut un compte Apple Developer (99$/an)
- On utilisera EAS Build (outil d'Expo) pour creer le fichier .ipa
- Soumission via App Store Connect
- Review Apple : 1-3 jours

**2. Google Play Store (Android)**
- Faut un compte Google Play Console (25$ une seule fois)
- EAS Build pour creer le fichier .aab
- Soumission via Play Console
- Review Google : quelques heures a 2 jours

Je pourrai t'accompagner etape par etape quand tu seras pret.

---

## Travailler avec Claude Code et Codex

**Claude Code (moi)** — Je suis sur ton Mac, je modifie les fichiers directement, j'execute les migrations SQL, je teste les builds.

**Codex (OpenAI)** — Il travaille sur GitHub, cree des branches et des Pull Requests que tu valides.

### Pour Codex :
1. Va sur https://chatgpt.com/codex
2. Connecte le repo `mamadou-ba7/yokhlaa`
3. Dis-lui par exemple : "Lis AGENTS.md puis ajoute un ecran d'abonnement"
4. Il cree une PR → tu la valides sur GitHub → les changements arrivent dans le projet

### Pour moi (Claude Code) :
- Tu me parles directement ici
- Je modifie le code sur ton Mac
- Je fais les migrations Supabase automatiquement

---

## Glossaire (les mots techniques)

| Mot | Signification |
|-----|--------------|
| **API** | Un "pont" entre deux logiciels pour echanger des donnees |
| **Backend** | La partie invisible (serveur, base de donnees) |
| **Frontend** | La partie visible (les ecrans de l'app) |
| **Base de donnees** | L'endroit ou sont stockees toutes les infos (users, courses...) |
| **RLS** | Securite qui empeche de voir les donnees des autres |
| **Push notification** | Message qui s'affiche sur le telephone meme quand l'app est fermee |
| **Realtime** | Les donnees se mettent a jour instantanement (comme WhatsApp) |
| **OTP** | Code a usage unique envoye par SMS pour se connecter |
| **GPS** | Systeme de localisation par satellite |
| **SDK** | Kit d'outils pour developper |
| **Build** | Transformer le code en app installable |
| **Deploy** | Publier l'app sur les stores |
| **PR (Pull Request)** | Proposition de modification du code a valider |
| **Branch** | Version parallele du code pour travailler sans casser le reste |
| **Commit** | Sauvegarde d'une modification du code |
| **Token** | Cle secrete pour acceder a un service |
| **Repo** | Le dossier du projet sur GitHub |
| **Surge** | Augmentation temporaire du prix quand il y a trop de demande |
