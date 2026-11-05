const { contextBridge, ipcRenderer } = require('electron');

// Exposition sécurisée d'API vers le front-end (index.html ou application Vue.js)
contextBridge.exposeInMainWorld('wiwiAPI', {
    // Exemple : Vérifier l'état du serveur local ou de la synchronisation
    getSystemStatus: () => ipcRenderer.invoke('get-system-status'),

    // Exemple : Envoyer une action de synchronisation manuelle
    triggerSync: () => ipcRenderer.invoke('trigger-sync'),

    // Écouteur d'événements venant du processus principal
    onSyncStatusUpdate: (callback) => {
        ipcRenderer.on('sync-status-update', (event, data) => callback(data));
    }
});