# Configuration Steam - Guide de démarrage

## 1. Configuration des variables d'environnement

Vous devez configurer deux variables dans le fichier `.env` :

### STEAM_API_KEY
✅ Déjà configurée

### STEAM_USER_ID
Vous devez trouver votre Steam ID 64-bit :

1. **Méthode 1 : Via votre profil Steam**
   - Allez sur votre profil Steam
   - Regardez l'URL : `https://steamcommunity.com/profiles/XXXXXXXXXXXXXXXXX`
   - Le nombre de 17 chiffres est votre Steam ID 64

2. **Méthode 2 : Via un outil en ligne**
   - Allez sur https://steamid.io/
   - Entrez votre nom d'utilisateur Steam ou l'URL de votre profil
   - Copiez le "steamID64"

3. **Ajoutez-le dans le .env** :
   ```
   STEAM_USER_ID=76561198XXXXXXXXX
   ```

## 2. Première synchronisation

Une fois configuré, visitez la page Steam de votre application :
- Cliquez sur le bouton **"Sync"** ou **"Commencer le tracking"**
- Cela enregistrera vos heures de jeu actuelles

## 3. Fonctionnement du système

### Stockage des données
- Les données sont stockées dans `web/data/steam-playtime.json`
- Format : historique jour par jour avec le temps de jeu total

### API Endpoints disponibles

1. **`GET /api/steam`**
   - Données de profil et statistiques générales
   - Liste des jeux les plus joués
   - Jeux récents

2. **`POST /api/steam/sync`**
   - Enregistre les heures de jeu actuelles
   - À appeler régulièrement pour construire l'historique

3. **`GET /api/steam/playtime?year=2025`**
   - Récupère l'historique pour une année donnée
   - Utilisé par le calendrier de contributions

## 4. Synchronisation automatique (RECOMMANDÉ)

Pour construire un historique complet, vous devez synchroniser les données régulièrement.

### Option A : Cron job local (Mac/Linux)

1. Ouvrez le crontab :
   ```bash
   crontab -e
   ```

2. Ajoutez cette ligne pour syncer toutes les 6 heures :
   ```
   0 */6 * * * curl -X POST http://localhost:3000/api/steam/sync
   ```

3. Ou une fois par jour à minuit :
   ```
   0 0 * * * curl -X POST http://localhost:3000/api/steam/sync
   ```

### Option B : Vercel Cron (si déployé sur Vercel)

1. Créez le fichier `vercel.json` :
   ```json
   {
     "crons": [{
       "path": "/api/steam/sync",
       "schedule": "0 */6 * * *"
     }]
   }
   ```

### Option C : GitHub Actions (si déployé)

1. Créez `.github/workflows/steam-sync.yml` :
   ```yaml
   name: Steam Sync
   on:
     schedule:
       - cron: '0 */6 * * *'
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger sync
           run: curl -X POST https://votre-app.vercel.app/api/steam/sync
   ```

### Option D : Synchronisation manuelle

- Cliquez simplement sur le bouton "Sync" dans l'interface quand vous voulez
- Bon pour commencer, mais nécessite une action manuelle

## 5. Limitations de l'API Steam

⚠️ **Important** : L'API Steam ne fournit PAS d'historique détaillé jour par jour.

- Elle donne seulement le temps de jeu des **2 dernières semaines**
- C'est pourquoi nous devons synchroniser régulièrement pour construire notre propre historique
- Plus vous synchronisez fréquemment, plus votre calendrier sera précis

### Recommandations

- **Idéal** : Synchroniser toutes les 6-12 heures
- **Minimum** : Synchroniser au moins une fois par jour
- **Début** : Les premières données ne montreront que les 2 dernières semaines, l'historique se construira au fil du temps

## 6. Calendrier des contributions

Le calendrier fonctionne exactement comme GitHub :
- **Intensité** : Basée sur les heures de jeu par jour
  - 0 min = Gris (pas de jeu)
  - 1-25% du max = Vert clair
  - 26-50% = Vert moyen
  - 51-75% = Vert foncé
  - 76-100% = Vert intense

- **Navigation** : Utilisez les flèches pour changer d'année
- **Tooltip** : Survolez les cases pour voir les détails

## 7. Dépannage

### "Steam API key or User ID not configured"
- Vérifiez que `STEAM_API_KEY` et `STEAM_USER_ID` sont bien dans le `.env`
- Redémarrez le serveur Next.js après avoir modifié le `.env`

### "Aucune donnée de jeu"
- Cliquez sur "Commencer le tracking" pour la première synchronisation
- Assurez-vous que votre profil Steam est public

### Le calendrier est vide
- Normal si c'est votre première synchronisation
- L'historique se construira au fil des synchronisations futures

### Profil Steam privé
- Allez dans les paramètres de confidentialité Steam
- Réglez "Détails du jeu" sur "Public"
