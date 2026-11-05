import { app, BrowserWindow, Tray, Menu, Notification } from 'electron';
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
        title: 'Wiwitrack Escola & Creche - Secrétaria'
    });

    mainWindow.loadFile(paths.index);

    // --- INTERCEPTION DE LA FERMETURE (Fausse fermeture / Cache dans le Tray) ---
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault(); // Annule la destruction réelle de la fenêtre
            mainWindow.hide();      // Cache la fenêtre en arrière-plan

            // Notification système pour informer que l'app tourne toujours
            sendSystemNotification(
                "Wiwitrack Escola",
                "L'application continue de s'exécuter en arrière-plan."
            );

            return false;
        }
    });

    // Une fois prêt, on ferme le splash screen et on affiche l'application principale
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
    // --- DÉMARRAGE AUTOMATIQUE WINDOWS ---
    if (app.isPackaged) {
        app.setLoginItemSettings({
            openAtLogin: true
        });
    }

    // --- CRÉATION DE L'ICÔNE DANS LA BARRE DES TÂCHES (TRAY / WIN + B) ---
    tray = new Tray(paths.icon);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '👁️‍🗨️ Abrir Wiwitrack',
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
            label: '❌ Fechar o Wiwitrack',
            click: () => {
                isQuitting = true; // Autorise la vraie fermeture
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Wiwitrack Escola & Creche');
    tray.setContextMenu(contextMenu);

    // Gère le clic simple sur l'icône du Tray pour afficher/masquer
    tray.on('click', () => {
        if (!mainWindow) {
            createWindow();
            return;
        }
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

    createSplashWindow();

    try {
        // Simulation d'un court délai d'initialisation (BDD locale / Express / mDNS)
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Lancement de la fenêtre principale
        createWindow();
    } catch (error) {
        console.error('Erreur critique lors du démarrage de Wiwitrack :', error);

        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.loadFile(paths.failed);
        }
    }
});

// Empêche l'application de s'arrêter complètement quand toutes les fenêtres sont masquées
app.on('window-all-closed', (event) => {
    event.preventDefault();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});