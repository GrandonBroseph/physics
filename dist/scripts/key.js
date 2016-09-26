(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = (function() {
  var keys = {};
  function assure(code) {
    if (!keys[code]) {
      keys[code] = {
        down: false,
        listeners: {
          down: [],
          hold: [],
          up: []
        }
      };
    }
    return keys[code];
  }
  return {
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
    init: function() {
      document.addEventListener("keydown", function(event) {
        var key = keys[event.keyCode];
        if (key) {
          key.down = true;
          key.listeners.down.some(function(listener) {
            listener.call(window);
          });
        }
      });
      document.addEventListener("keyup", function(event) {
        var key = keys[event.keyCode];
        if (key) {
          key.down = false;
          key.listeners.up.some(function(listener) {
            listener.call(window);
          });
        }
      });
      return this;
    },
    down: function(code, callback) {
      var key = assure(code);
      if (callback) {
        key.listeners.down.push(callback);
        return this;
      } else {
        return key.down;
      }
    },
    up: function(code, callback) {
      var key = assure(code);
      if (callback) {
        key.listeners.up.push(callback);
        return this;
      } else {

      }
    }
  };
})();

},{}]},{},[1])