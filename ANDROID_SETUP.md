# Guide complet Play Store - Lucky Stop

## ✅ Configuration actuelle

### Capacitor configuré
- ✅ Dependencies installées (@capacitor/core, ios, android, cli)
- ✅ capacitor.config.ts créé (compatible iOS et Android)
- ✅ StatusBar et SplashScreen configurés
- ✅ Navigation HashRouter (compatible mobile)
- ✅ Icône et splash screen créés
- ✅ Bundle ID: `com.bryangouzou.luckystop` (identique iOS/Android)

## 📋 Checklist avant soumission Play Store

### 1. ⚠️ Bundle ID / Application ID
**IMPORTANT** : Le Bundle ID est déjà configuré et ne doit PAS être changé
- Actuel : `com.bryangouzou.luckystop` ✅
- **NE PAS MODIFIER** (déjà utilisé sur Apple Store)

### 2. Configuration Production
✅ La configuration actuelle dans `capacitor.config.ts` est déjà en mode production (pas de section `server`)

### 3. Assets requis
- [x] Icône 512x512 : `public/icon-512.png` ✅
- [x] Splash screen : `public/splash-1024x1920.png` ✅
- [ ] **À FAIRE dans Android Studio** : Générer toutes les tailles d'icônes Android
  - Les tailles requises : 48dp, 72dp, 96dp, 144dp, 192dp
  - Android Studio peut les générer automatiquement

### 4. Informations Play Store Console (à préparer)

**Informations de base** :
- Nom de l'application : Lucky Stop
- Description courte (80 caractères max)
- Description détaillée (4000 caractères max)
- Catégorie : Jeux > Action

**Graphiques requis** :
- Icône haute résolution : 512x512px (PNG, 32-bit avec alpha)
- Bannière de fonctionnalité : 1024x500px (optionnel mais recommandé)
- Captures d'écran téléphone : 2-8 images (min 320px, max 3840px)
- Captures d'écran tablette 7" : 1-8 images (optionnel)
- Captures d'écran tablette 10" : 1-8 images (optionnel)

**Légal (OBLIGATOIRE)** :
- URL Politique de confidentialité (publique)
- Adresse e-mail développeur
- Adresse physique (requise pour les apps avec achats)

### 5. Classification du contenu
- Questionnaire de classification requis
- Lucky Stop : Probablement "PEGI 3" ou "Everyone"
- Déclarer les publicités (AdMob)

### 6. Store Listing - Traductions
Préparez les descriptions dans plusieurs langues :
- Français ✅ (langue principale)
- Anglais
- Espagnol
- Allemand
- Etc.

## 🚀 Étapes de soumission

### Étape 1 : Préparer le projet

```bash
# 1. Exporter vers GitHub (bouton Lovable) si pas déjà fait
# 2. Git pull sur votre machine

# 3. Installer les dépendances
npm install

# 4. Ajouter Android (si pas déjà fait)
npx cap add android

# 5. Mettre à jour les dépendances Android
npx cap update android

# 6. Builder le projet
npm run build

# 7. Synchroniser
npx cap sync android

# 8. Ouvrir Android Studio
npx cap open android
```

### Étape 2 : Configuration Android Studio

1. **Module: app (build.gradle)** :
   - Vérifier `applicationId` = `com.bryangouzou.luckystop`
   - Vérifier `versionCode` = 1 (à incrémenter pour chaque mise à jour)
   - Vérifier `versionName` = "1.0.0"
   - `minSdkVersion` = 22 (recommandé)
   - `targetSdkVersion` = 34 (Android 14, requis depuis août 2024)

2. **Icônes et ressources** :
   - Clic droit sur `res` > New > Image Asset
   - Importer votre icône 512x512
   - Générer toutes les tailles (mipmap)
   
3. **Splash Screen** :
   - Déjà configuré via Capacitor
   - Vérifier dans `res/drawable`

4. **AndroidManifest.xml** :
   - Vérifier les permissions requises
   - Internet : ✅ (pour Supabase, classement)
   - Notifications : ✅ (récompenses quotidiennes)

### Étape 3 : Générer le Keystore (PREMIÈRE FOIS SEULEMENT)

**⚠️ CRITIQUE : Ne perdez JAMAIS votre keystore !**

```bash
# Créer un keystore pour signer l'app
keytool -genkey -v -keystore lucky-stop-release.keystore -alias lucky-stop -keyalg RSA -keysize 2048 -validity 10000

# Remplir les informations demandées
# ⚠️ NOTEZ LE MOT DE PASSE DANS UN ENDROIT SÛR
```

**Configurer le signing** :

Créer `android/key.properties` (NE PAS committer sur Git) :
```properties
storePassword=VOTRE_MOT_DE_PASSE
keyPassword=VOTRE_MOT_DE_PASSE
keyAlias=lucky-stop
storeFile=/chemin/vers/lucky-stop-release.keystore
```

Modifier `android/app/build.gradle` :
```gradle
// Avant android {
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Étape 4 : Construire l'APK/AAB de production

**Android App Bundle (AAB) - RECOMMANDÉ pour Play Store** :
```bash
cd android
./gradlew bundleRelease

# Le fichier sera dans :
# android/app/build/outputs/bundle/release/app-release.aab
```

**APK (alternative, moins optimisé)** :
```bash
cd android
./gradlew assembleRelease

# Le fichier sera dans :
# android/app/build/outputs/apk/release/app-release.apk
```

### Étape 5 : Tester l'APK avant soumission

```bash
# Installer l'APK sur un appareil Android connecté
adb install android/app/build/outputs/apk/release/app-release.apk

# Ou via Android Studio : Build > Generate Signed Bundle/APK
```

**Tests recommandés** :
- [ ] Connexion Supabase (authentification)
- [ ] Classement en ligne
- [ ] Achats boutique (pièces)
- [ ] Récompenses quotidiennes
- [ ] Publicités AdMob (si configuré)
- [ ] Rotation d'écran
- [ ] Mode avion (fonctionnalités offline)
- [ ] Performance (pas de lag)
- [ ] Pas de crash au lancement

### Étape 6 : Play Console

1. Aller sur [Google Play Console](https://play.google.com/console)

2. **Créer une nouvelle application** :
   - Cliquer sur "Créer une application"
   - Nom : Lucky Stop
   - Langue par défaut : Français
   - Type : Application ou jeu
   - Gratuit ou payant : Gratuit

3. **Fiche Play Store** :
   - Description courte et longue
   - Icône 512x512px
   - Bannière de fonctionnalité (recommandé)
   - Captures d'écran (minimum 2)
   - Catégorie : Jeux > Action
   - Tags (optionnel)

4. **Classification du contenu** :
   - Répondre au questionnaire
   - Déclarer les publicités (AdMob)

5. **Tarification et distribution** :
   - Pays disponibles
   - Gratuit
   - Contenu pour la famille (optionnel)

6. **Publication** :
   - Aller dans "Production"
   - Créer une nouvelle version
   - Uploader l'AAB
   - Notes de version (en français et anglais)
   - Vérifier tous les éléments requis
   - **Envoyer pour examen** 🚀

## ⏱️ Délais de review

- Review initiale : 1-7 jours (généralement 1-3 jours)
- Corrections : quelques heures à quelques jours
- Si rejeté : corriger et re-soumettre

## ⚠️ Erreurs courantes à éviter

1. **Application ID différent** entre capacitor.config.ts et build.gradle
2. **Keystore perdu** → impossible de mettre à jour l'app !
3. **Politique de confidentialité manquante** (obligatoire)
4. **Icônes incorrectes** (mauvaise résolution)
5. **Permissions non justifiées** dans AndroidManifest.xml
6. **Target SDK obsolète** (doit être 33+ en 2024)
7. **Tests insuffisants** sur appareils réels Android
8. **AAB non signé** correctement

## 🔄 Mises à jour futures

Après modifications dans Lovable :

```bash
# 1. Git pull
git pull

# 2. Installer nouvelles deps si besoin
npm install

# 3. Rebuild
npm run build

# 4. Sync
npx cap sync android

# 5. Incrémenter versionCode et versionName dans build.gradle

# 6. Ouvrir Android Studio
npx cap open android

# 7. Build > Generate Signed Bundle (AAB)

# 8. Upload sur Play Console (Production > Nouvelle version)
```

**Incrémenter les versions dans `android/app/build.gradle`** :
```gradle
android {
    defaultConfig {
        versionCode 2  // Toujours +1 pour chaque soumission
        versionName "1.0.1"  // Version visible pour les utilisateurs
    }
}
```

Règles de versioning :
- versionCode : TOUJOURS incrémenter (+1) pour chaque soumission
- versionName : 
  - 1.0.0 → 1.0.1 (correction bugs)
  - 1.0.0 → 1.1.0 (nouvelles fonctionnalités)
  - 1.0.0 → 2.0.0 (changements majeurs)

## 🔒 Sécurité du Keystore

**⚠️ EXTRÊMEMENT IMPORTANT** :

1. **Sauvegardez votre keystore** dans plusieurs endroits sûrs :
   - Cloud sécurisé (Google Drive chiffré, Dropbox)
   - Disque dur externe
   - Gestionnaire de mots de passe

2. **Notez les mots de passe** :
   - storePassword
   - keyPassword
   - keyAlias

3. **Si vous perdez le keystore** :
   - ❌ IMPOSSIBLE de mettre à jour l'app
   - ❌ Obligation de créer une nouvelle app avec un nouveau package name
   - ❌ Perte de tous les utilisateurs et avis

## 📚 Ressources

- [Google Play Console](https://play.google.com/console)
- [Règles de publication Play Store](https://play.google.com/about/developer-content-policy/)
- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Android Studio](https://developer.android.com/studio)

## 💡 Conseils spécifiques Android

1. **Testez sur plusieurs appareils** :
   - Différentes versions Android (minimum API 22)
   - Différentes tailles d'écran
   - Différents fabricants (Samsung, Xiaomi, etc.)

2. **Optimisez les graphiques** :
   - Utilisez AAB (optimisation automatique par appareil)
   - Compressez les images

3. **AdMob (si utilisé)** :
   - Vérifiez les IDs Android dans le code
   - Testez les publicités sur Android
   - IDs différents iOS/Android

4. **Supabase** :
   - Vérifiez la connexion Android
   - Testez l'authentification

5. **Store Listing** :
   - Traduisez dans plusieurs langues
   - Captures d'écran attractives
   - Description optimisée SEO (mots-clés)

## ✅ Checklist finale avant soumission

- [ ] Bundle ID configuré (`com.bryangouzou.luckystop`)
- [ ] Keystore créé et sauvegardé en sécurité
- [ ] Mots de passe keystore notés
- [ ] AAB signé généré
- [ ] Testé sur plusieurs appareils Android réels
- [ ] Toutes les icônes générées
- [ ] Politique de confidentialité créée et URL publique
- [ ] Captures d'écran préparées (téléphone minimum)
- [ ] Description et textes rédigés
- [ ] Classification du contenu remplie
- [ ] AdMob configuré pour Android (si applicable)
- [ ] Play Console complètement configuré
- [ ] AAB uploadé et notes de version rédigées

## 🆚 Différences iOS vs Android

| Aspect | iOS (Apple Store) | Android (Play Store) |
|--------|------------------|---------------------|
| Bundle ID | com.bryangouzou.luckystop | com.bryangouzou.luckystop |
| Format | IPA | AAB (recommandé) ou APK |
| Signing | Certificat Apple Dev | Keystore Java |
| Review | 24-48h | 1-7 jours |
| Politique confidentialité | Obligatoire | Obligatoire |
| Coût développeur | 99€/an | 25€ une fois |
| Icône | Plusieurs tailles | Plusieurs densités |
| Distribution | TestFlight | Internal Testing |

**Bon courage pour la soumission Android ! 🚀**

---

**Note** : Ce guide complète le MOBILE_SETUP.md (iOS). Les deux plateformes peuvent coexister avec le même Bundle ID.