const CACHE_VERSION = 10;

const BASE_CACHE_FILES = [
  "./site.webmanifest",
  "./browserconfig.xml",

  "./static/img/android-chrome-192x192.png",
  "./static/img/android-chrome-512x512.png",
  "./static/img/apple-touch-icon.png",
  "./static/img/favicon-16x16.png",
  "./static/img/favicon-32x32.png",
  "./static/img/mstile-150x150.png",
  "./static/img/safari-pinned-tab.svg",

  "./static/css/images/marker-icon.png",
  "./static/css/images/marker-icon-2x.png",
  "./static/css/images/marker-shadow.png",
  "./static/css/images/layers.png",
  "./static/css/images/layers-2x.png",

  "./static/css/bootstrap-slider.css",
  "./static/css/bootstrap-toggle.min.css",
  "./static/css/bootstrap.min.css",
  "./static/css/leaflet.min.css",
  "./static/css/dvf.min.css",
  "./static/css/easy-button.css",
  "./static/css/leaflet.awesome-markers.css",

  "./static/fonts/glyphicons-halflings-regular.eot",
  "./static/fonts/glyphicons-halflings-regular.svg",
  "./static/fonts/glyphicons-halflings-regular.ttf",
  "./static/fonts/glyphicons-halflings-regular.woff",
  "./static/fonts/glyphicons-halflings-regular.woff2",

  "./static/js/bootstrap-slider.js",
  "./static/js/bootstrap-toggle.min.js",
  "./static/js/bootstrap.min.js",
  "./static/js/jquery-3.1.1.min.js",
  "./static/js/leaflet.min.js",
  "./static/js/leaflet-dvf.js",
  "./static/js/leaflet.awesome-markers.min.js",
  "./static/js/easy-button.js",
  "./static/js/dom-to-image.min.js",
  "./static/js/file-saver.min.js",
  "./app.js"
];

const OFFLINE_CACHE_FILES = [
  "./site.webmanifest",
  "./browserconfig.xml",

  "./static/img/android-chrome-192x192.png",
  "./static/img/android-chrome-512x512.png",
  "./static/img/apple-touch-icon.png",
  "./static/img/favicon-16x16.png",
  "./static/img/favicon-32x32.png",
  "./static/img/mstile-150x150.png",
  "./static/img/safari-pinned-tab.svg",
  "./app.js"
];

const NOT_FOUND_CACHE_FILES = ["./404.html"];

const OFFLINE_PAGE = "./offline.html";
const NOT_FOUND_PAGE = "./404.html";

const CACHE_VERSIONS = {
  assets: "assets-v" + CACHE_VERSION,
  content: "content-v" + CACHE_VERSION,
  offline: "offline-v" + CACHE_VERSION,
  notFound: "404-v" + CACHE_VERSION
};

// Define MAX_TTL's in SECONDS for specific file extensions
const MAX_TTL = {
  "./": 31536000,
  html: 31536000,
  json: 86400,
  js: 31536000,
  css: 31536000,
  svg: 31536000,
  png: 86400
};

const CACHE_BLACKLIST = [
  str => {
    return !str.startsWith("https://citymap.amrhub.ru");
  }
];

const SUPPORTED_METHODS = ["GET"];

/**
 * isBlackListed
 * @param {string} url
 * @returns {boolean}
 */
function isBlacklisted(url) {
  return CACHE_BLACKLIST.length > 0
    ? !CACHE_BLACKLIST.filter(rule => {
        if (typeof rule === "function") {
          return !rule(url);
        } else {
          return false;
        }
      }).length
    : false;
}

/**
 * getFileExtension
 * @param {string} url
 * @returns {string}
 */
function getFileExtension(url) {
  let extension = url
    .split(".")
    .reverse()[0]
    .split("?")[0];
  return extension.endsWith("./") ? "./" : extension;
}

/**
 * getTTL
 * @param {string} url
 */
function getTTL(url) {
  if (typeof url === "string") {
    let extension = getFileExtension(url);
    if (typeof MAX_TTL[extension] === "number") {
      return MAX_TTL[extension];
    } else {
      return null;
    }
  } else {
    return null;
  }
}

/**
 * installServiceWorker
 * @returns {Promise}
 */
function installServiceWorker() {
  return Promise.all([
    caches.open(CACHE_VERSIONS.assets).then(cache => {
      return cache.addAll(BASE_CACHE_FILES);
    }),
    caches.open(CACHE_VERSIONS.offline).then(cache => {
      return cache.addAll(OFFLINE_CACHE_FILES);
    }),
    caches.open(CACHE_VERSIONS.notFound).then(cache => {
      return cache.addAll(NOT_FOUND_CACHE_FILES);
    })
  ]);
}

/**
 * cleanupLegacyCache
 * @returns {Promise}
 */
function cleanupLegacyCache() {
  let currentCaches = Object.keys(CACHE_VERSIONS).map(key => {
    return CACHE_VERSIONS[key];
  });

  return new Promise((resolve, reject) => {
    caches
      .keys()
      .then(keys => {
        return (legacyKeys = keys.filter(key => {
          return !~currentCaches.indexOf(key);
        }));
      })
      .then(legacy => {
        if (legacy.length) {
          Promise.all(
            legacy.map(legacyKey => {
              return caches.delete(legacyKey);
            })
          )
            .then(() => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        } else {
          resolve();
        }
      })
      .catch(() => {
        reject();
      });
  });
}

self.addEventListener("install", event => {
  event.waitUntil(installServiceWorker());
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([cleanupLegacyCache()]).catch(err => {
      event.skipWaiting();
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.open(CACHE_VERSIONS.content).then(cache => {
      return cache
        .match(event.request)
        .then(response => {
          if (response) {
            let headers = response.headers.entries();
            let date = null;

            for (let pair of headers) {
              if (pair[0] === "date") {
                date = new Date(pair[1]);
              }
            }

            if (date) {
              let age = parseInt(
                (new Date().getTime() - date.getTime()) / 1000
              );
              let ttl = getTTL(event.request.url);

              if (ttl && age > ttl) {
                return new Promise(resolve => {
                  return fetch(event.request)
                    .then(updatedResponse => {
                      if (updatedResponse) {
                        cache.put(event.request, updatedResponse.clone());
                        resolve(updatedResponse);
                      } else {
                        resolve(response);
                      }
                    })
                    .catch(() => {
                      resolve(response);
                    });
                }).catch(err => {
                  return response;
                });
              } else {
                return response;
              }
            } else {
              return response;
            }
          } else {
            return null;
          }
        })
        .then(response => {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(response => {
                if (response.status < 400) {
                  if (
                    ~SUPPORTED_METHODS.indexOf(event.request.method) &&
                    !isBlacklisted(event.request.url)
                  ) {
                    cache.put(event.request, response.clone());
                  }
                  return response;
                } else {
                  return caches.open(CACHE_VERSIONS.notFound).then(cache => {
                    return cache.match(NOT_FOUND_PAGE);
                  });
                }
              })
              .then(response => {
                if (response) {
                  return response;
                }
              })
              .catch(() => {
                return caches
                  .open(CACHE_VERSIONS.offline)
                  .then(offlineCache => {
                    return offlineCache.match(OFFLINE_PAGE);
                  });
              });
          }
        })
        .catch(error => {
          console.error("  Error in fetch handler:", error);
          throw error;
        });
    })
  );
});
