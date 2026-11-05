/**
 * =====================================================================
 *  WIWITRACK ESCOLA  -  DECOUVERTE RESEAU (mDNS / Bonjour)
 *  Objectif : les postes clients (secretariat, caisse, enseignants)
 *  joignent le serveur par un NOM DE DOMAINE au lieu d'une adresse IP
 *  qui change a chaque redemarrage du routeur.
 *
 *  Le serveur publie un service `_http._tcp` nomme `wiwitrack-escola`.
 *  Les clients obtiennent alors :  http://wiwitrack-escola.local:<port>
 *  (resolu automatiquement par Bonjour/Avahi sur le LAN).
 * =====================================================================
 */
import { Bonjour } from 'bonjour-service';
import { config } from './env.js';

let bonjour = null;
let published = null;

/** Publie le service mDNS. Renvoie le hostname .local utilisable par les clients. */
export function startDiscovery() {
  if (!config.discovery.enabled) {
    console.log('[mdns] Decouverte desactivee (DISCOVERY_ENABLED=false).');
    return null;
  }
  bonjour = new Bonjour();
  published = bonjour.publish({
    name: config.discovery.serviceName,
    type: config.discovery.serviceType, // 'http'
    port: config.server.port,
    txt: { app: 'wiwitrack-escola', role: 'local-server' },
  });

  const hostname = `${config.discovery.serviceName}.local`;
  console.log(`[mdns] Service publie -> http://${hostname}:${config.server.port}`);
  console.log('[mdns] Les clients peuvent utiliser ce nom de domaine au lieu de l\'IP.');
  return hostname;
}

/**
 * Cote CLIENT (utilitaire) : recherche le serveur sur le LAN.
 * Renvoie une promesse resolue avec { host, port, addresses } ou null.
 */
export function findServer(timeoutMs = 4000) {
  return new Promise((resolve) => {
    const bj = new Bonjour();
    const browser = bj.find({ type: config.discovery.serviceType });
    const timer = setTimeout(() => {
      browser.stop();
      bj.destroy();
      resolve(null);
    }, timeoutMs);

    browser.on('up', (service) => {
      if (service.name === config.discovery.serviceName) {
        clearTimeout(timer);
        browser.stop();
        bj.destroy();
        resolve({
          host: service.host || `${config.discovery.serviceName}.local`,
          port: service.port,
          addresses: service.addresses || [],
        });
      }
    });
  });
}

/** Arret propre a la fermeture de l'application. */
export function stopDiscovery() {
  try {
    if (published) published.stop?.();
    if (bonjour) bonjour.destroy();
  } catch { /* noop */ }
}
