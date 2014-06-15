// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// A simple, incomplete implementation of the CacheStorage API, intended to facilitate
// end to end serviceworker testing.

// See https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cache-storage

(function(global) {
    var log = console.log.bind(console);
    var err = console.error.bind(console);

    var CacheStorage = function() {
        // log("custom cache storage");
        var caches = this.cachesByName = {};
        // Fetch a listing of all the cache objects and create front
        // objects for them here.
        idbCacheUtils.getAllCacheNames().then(function(names) {
            names.forEach(function(name) {
                caches[name] = new Cache(name);
            });
        }, err);
    };

    CacheStorage.prototype.get = function(key) {
        // FIXME(slightlyoff):
        //      key here is a string, not a Request, which is wrong.
        if (this.cachesByName.hasOwnProperty(key)) {
            return Promise.resolve(this.cachesByName[key]);
        }
        return Promise.reject('not found');
    };

    CacheStorage.prototype.has = function(key) {
        return Promise.resolve(this.cachesByName.hasOwnProperty(key));
    };

    // FIXME: Engage standardization on removing this method from the spec.
    CacheStorage.prototype.set = Promise.reject.bind(Promise, 'CacheStorage.prototype.set() not implemented.');

    // FIXME: Engage standardization on adding this method to the spec.
    CacheStorage.prototype.create = function(key) {
        // log("CacheStorage::create", key);
        if (!this.cachesByName[key]) {
            this.cachesByName[key] = new Cache();
            idbCacheUtils.addCacheToList(key);
        }

        return Promise.resolve(this.cachesByName[key]);
    };

    // FIXME: Engage standarization on adding this method to the spec.
    CacheStorage.prototype.rename = function(fromKey, toKey) {
        if (!this.cachesByName.hasOwnProperty(fromKey)) {
            return Promise.reject('not found');
        }
        this.cachesByName[toKey] = this.cachesByName[fromKey];
        delete this.cachesByName[fromKey];

        return Promise.resolve();
    };

    CacheStorage.prototype.clear = function() {
        this.cachesByName = {};

        return Promise.resolve();
    };

    CacheStorage.prototype.delete = function(key) {
        delete this.cachesByName[key];

        return Promise.resolve();
    };

    CacheStorage.prototype.forEach = function(callback, thisArg) {
        Object.keys(this.cachesByName).map(function(key) {
            thisArg.callback(this.cachesByName[key], key, this);
        });
        return Promise.resolve();
    };

    // FIXME: Implement this.
    CacheStorage.prototype.entries = Promise.reject.bind(Promise, 'CacheStorage.prototype.entries() not implemented.');

    CacheStorage.prototype.keys = function() {
        return Promise.resolve(Object.keys(this.cachesByName));
    };

    CacheStorage.prototype.values = function() {
        return Promise.resolve(Object.keys(this.cachesByName).map(function(key) {
            return this.cachesByName[key];
        }));
    };

    CacheStorage.prototype.size = function() {
        return Promise.resolve(Object.keys(this.cachesByName).length);
    };

    // FIXME: Figure out what should be done with undefined or poorly defined |cacheName| values.
    CacheStorage.prototype.match = function(url, cacheName) {
        return this.get(cacheName).then(function(cache) {
            return cache.match(url);
        });
    };

    if (!global.caches ||
        !global.caches.constructor ||
         global.caches.constructor.
            toString().indexOf("{} [native code] }") == -1) {
        global.caches = new CacheStorage();
    }
}(self));  // window or worker global scope.