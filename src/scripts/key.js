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
