# Corrections Steam - Guide

## ✅ Problèmes corrigés

### 1. **Calcul du temps de jeu incorrect**

**Avant** : Le système enregistrait le temps total des 2 dernières semaines comme temps joué aujourd'hui (d'où les 1817 minutes).

**Après** : Le système calcule maintenant la **différence** entre deux synchronisations :
- À chaque sync, on prend un "snapshot" du temps total de chaque jeu
- On compare avec le snapshot précédent
- La différence = temps joué depuis la dernière synchronisation
- Seule cette différence est enregistrée pour aujourd'hui

### 2. **Terminologie corrigée**

- ✅ "Contributions" → "Heures de jeu"
- ✅ Interface mise à jour dans toute l'application

### 3. **Synchronisation automatique**

- ✅ Endpoint cron créé : `/api/cron/steam-sync`
- ✅ Système de retry (3 tentatives avec délai de 5 secondes)
- ✅ Configuration Vercel Cron pour déploiement
- ✅ Script npm pour tests manuels

## 🔧 Actions requises

### 1. **Supprimer les anciennes données** (IMPORTANT)

Les anciennes données sont incorrectes. Supprimez le fichier :

```bash
rm web/data/steam-playtime.json
```

### 2. **Redémarrer le serveur**

```bash
# Arrêtez le serveur actuel (Ctrl+C)
npm run dev
```

### 3. **Première synchronisation**

Allez sur `/steam` et cliquez sur "Sync" ou "Commencer le tracking"

**Important** :
- La première sync créera un snapshot de référence
- Aucun temps de jeu ne sera enregistré (normal, pas de données précédentes)
- À partir de la deuxième sync, le temps sera calculé correctement

### 4. **Tester la synchronisation**

Attendez quelques heures, jouez à un jeu, puis :

```bash
npm run steam:sync
```

Ou cliquez sur "Sync" dans l'interface.

## 📊 Comment ça fonctionne maintenant

### Système de snapshot

```
Jour 1 - 10h00 : Première sync
├─ CS:GO = 500 minutes total
├─ Dota 2 = 300 minutes total
└─ Snapshot sauvegardé, aucune entrée créée (pas de référence)

Jour 1 - 18h00 : Deuxième sync
├─ CS:GO = 520 minutes total (+20 min)
├─ Dota 2 = 300 minutes total (0 min)
└─ Entrée créée : Jour 1 = 20 minutes de jeu

Jour 2 - 10h00 : Sync du lendemain
├─ CS:GO = 580 minutes total (+60 min)
├─ Dota 2 = 350 minutes total (+50 min)
└─ Entrée créée : Jour 2 = 110 minutes de jeu
```

### Multiples syncs dans la même journée

Si vous synchronisez plusieurs fois le même jour :
- Les temps sont **additionnés**
- Le snapshot est **mis à jour** à chaque fois

Exemple :
```
Jour 1 - 10h00 : +20 min → Total jour = 20 min
Jour 1 - 14h00 : +15 min → Total jour = 35 min
Jour 1 - 20h00 : +10 min → Total jour = 45 min
```

## 🔄 Synchronisation automatique

### Option 1 : Vercel Cron (Déploiement)

Le fichier `vercel.json` est déjà configuré :
- Synchronisation quotidienne à minuit (UTC)
- S'active automatiquement lors du déploiement sur Vercel

### Option 2 : Cron local (Mac/Linux)

Pour un environnement de développement local :

1. Ouvrez crontab :
```bash
crontab -e
```

2. Ajoutez (sync tous les jours à minuit) :
```
0 0 * * * curl http://localhost:3000/api/cron/steam-sync
```

3. Ou toutes les 6 heures :
```
0 */6 * * * curl http://localhost:3000/api/cron/steam-sync
```

### Option 3 : Test manuel

```bash
# Via npm
npm run steam:sync

# Ou directement
curl -X POST http://localhost:3000/api/steam/sync
```

## 📈 Recommandations de synchronisation

Pour un historique précis :

1. **Idéal** : Toutes les 6-12 heures
   - Capture bien les sessions de jeu
   - Pas trop fréquent (limite API Steam)

2. **Minimum** : Une fois par jour
   - Suffisant pour le calendrier annuel
   - Configure le cron à minuit

3. **Premier mois** : Syncer manuellement
   - Construire l'historique initial
   - Vérifier que tout fonctionne

## 🎯 Vérification

Pour vérifier que tout fonctionne :

1. **Première sync** : Créer le snapshot
   ```bash
   npm run steam:sync
   ```

2. **Jouez quelques minutes** à n'importe quel jeu

3. **Deuxième sync** après avoir joué
   ```bash
   npm run steam:sync
   ```

4. **Vérifiez** dans l'interface `/steam`
   - Le calendrier devrait montrer du temps pour aujourd'hui
   - Le nombre d'heures devrait correspondre au temps joué

## ⚠️ Limitations

- L'API Steam ne donne que le temps **total** par jeu
- On ne peut pas récupérer l'historique passé
- L'historique se construit progressivement
- Plus vous synchronisez régulièrement, plus le calendrier sera précis

## 🐛 Dépannage

### "0 minutes enregistrées"
- Normal pour la première sync (création du snapshot)
- Attendez la deuxième sync après avoir joué

### "Trop de temps enregistré"
- Supprimez `web/data/steam-playtime.json`
- Recommencez avec une sync propre

### "Sync échoue"
- Vérifiez `STEAM_API_KEY` et `STEAM_USER_ID` dans `.env`
- Le système fera 3 tentatives automatiquement
- Vérifiez que votre profil Steam est public
