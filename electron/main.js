import { app, BrowserWindow, Tray, Menu, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration __dirname pour les ES Modules dans Electron
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
let isQuitting = false; // Permet de savoir si l'utilisateur veut vraiment quitter l'app

// Gestion propre des chemins selon l'environnement
const paths = {
    icon: path.join(__dirname, '../build/wiEscola-logo.png'),
    preload: path.join(__dirname, 'preload.js'),
    index: path.join(__dirname, '../index.html'),
    splash: path.join(__dirname, '../src', 'splash.html'),
    failed: path.join(__dirname, '../src', 'failed.html')
};

let mainWindow = null;
let splashWindow = null;
let tray = null; // Variable globale pour stocker l'icône de la barre des tâches

// Fonction pour envoyer une notification système Windows (Toast)
function sendSystemNotification(title, body) {
    if (!Notification.isSupported()) {
        console.log("Les notifications système ne sont pas supportées sur ce système.");
        return;
    }

    const notification = new Notification({
        title: title,
        body: body,
        icon: paths.icon
    });

    // Au clic sur la notification, on réouvre l'application principale
    notification.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        } else {
            createWindow();
        }
    });

    notification.show();
}

// --- CONFIGURATION DE LA MISE À JOUT AUTOMATIQUE (ELECTRON-UPDATER) ---
function setupAutoUpdater() {
    if (!isDev) {
        autoUpdater.logger = console;
        autoUpdater.logger.transports.file.level = 'info';

        autoUpdater.on('update-available', () => {
            sendSystemNotification(
                "Mise à jour disponible",
                "Une nouvelle version de Wiwitrack est en cours de téléchargement en arrière-plan..."
            );
        });

        autoUpdater.on('update-downloaded', () => {
            sendSystemNotification(
                "Mise à jour prête",
                "Téléchargement terminé. L'application va s'appliquer automatiquement."
            );
            // Redémarre l'application et installe la mise à jour
            setTimeout(() => {
                autoUpdater.quitAndInstall(false, true);
            }, 3000);
        });

        autoUpdater.on('error', (err) => {
            console.error('Erreur lors de la mise à jour automatique :', err);
        });

        // Vérifie les mises à jour 6 secondes après le lancement
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 6000);
    }
}

// 1. Création de la fenêtre de chargement (Splash Screen)
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 450,
        height: 320,
        frame: false,
        transparent: true,
        center: true,
        resizable: false,
        icon: paths.icon,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(paths.splash);
}

// 2. Création de la fenêtre principale de l'application (Secrétariat / ERP)
function createWindow() {
    mainWindow = new BrowserWindow({
        height: 768,
        width: 1366,
        minHeight: 650,
        minWidth: 1000,
        center: true,
        show: false, // Cachée au départ pour l'afficher proprement après le splash
        autoHideMenuBar: true,
        icon: paths.icon,
        webPreferences: {
            preload: paths.preload,
            nodeIntegration: false,
            contextIsolation: true,
            devTools: isDev
        },
        title: 'Wiwitrack Escola & Creche - Secrétariat'
    });

    mainWindow.loadFile(paths.index);

    // --- INTERCEPTION DE LA FERMETURE (Fausse fermeture / Cache dans le Tray) ---
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault(); // Annule la destruction réelle de la fenêtre
            mainWindow.hide();      // Cache la fenêtre en arrière-plan

            sendSystemNotification(
                "Wiwitrack Escola",
                "L'application continue de s'exécuter en arrière-plan."
            );

            return false;
        }
    });

    mainWindow.once('ready-to-show', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
        }
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 3. Cycle de vie de l'application Electron
app.whenReady().then(async () => {
    // --- DÉMARRAGE AUTOMATIQUE WINDOWS (En production) ---
    if (app.isPackaged) {
        app.setLoginItemSettings({
            openAtLogin: true
        });
    }

    // --- CRÉATION DE L'ICÔNE DANS LA BARRE DES TÂCHES (TRAY / WIN + B) ---
    tray = new Tray(paths.icon);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Ouvrir Wiwitrack',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quitter définitivement',
            click: () => {
                isQuitting = true; // Autorise la vraie fermeture
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Wiwitrack Escola & Creche');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (!mainWindow) {
            createWindow();
            return;
        }
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

    createSplashWindow();

    try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        createWindow();

        // Lance le gestionnaire de màj automatique
        setupAutoUpdater();
    } catch (error) {
        console.error('Erreur critique lors du démarrage de Wiwitrack :', error);

        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.loadFile(paths.failed);
        }
    }
});

app.on('window-all-closed', (event) => {
    event.preventDefault();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});