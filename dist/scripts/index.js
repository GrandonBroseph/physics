(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  var socket = io(),
      circles = [],
      circle,
      playfield = $(".playfield")[0],
      geometry = require("./geometry"),
      key = require("./key"),
      bounds = new geometry.Rect(0, 0, 640, 480);

  function add(data, index) {
    var item = new Circle(data.id).create({
      pos: new geometry.Vector(bounds.center.x, bounds.center.y / 2),
      size: 24,
      color: data.color
    });
    if (index == 0)
      circle = item;
    return item;
  }

  function remove(id) {
    for (var i = 0, circle; circle = circles[i ++];) {
      if (id === circle.id) {
        circle.destroy();
        circles.splice(i, 1);
        break;
      }
    }
  }

  socket.on("init", function(data) {
    var sockets = JSON.parse(data);
    sockets.some(function(socket, index) {
      add(socket, index);
    });
    init();
  });

  socket.on("enter", function(data, index) {
    var socket = JSON.parse(data);
    add(socket, index);
  });

  socket.on("exit", remove);

  function Circle(id) {
    this.controls = {};
    this.speed = .25;
    this.friction = .975;
    this.rect = null;
    this.lastPos = null;
    this.velocity = null;
    this.color = null;
    this.size = null;
    this.radius = null;
    this.mass = null;
    this.id = id;
    this.element = document.createElement("div");
    this.element.classList.add("circle");
    this.element.id = this.id;
  }

  Circle.prototype = {
    create: function(data) {
      this.pos   = data.pos || new geometry.Vector(bounds.center.x, bounds.center.y);
      this.size  = data.size || 64;
      this.mass  = this.size;
      this.radius = this.size / 2;
      this.color = data.color || "gray";
      this.reset(this.pos);
      this.element.style.backgroundColor = this.color;
      this.element.style.width  = this.size+"em";
      this.element.style.height = this.size+"em";
      playfield.appendChild(this.element);
      circles.push(this);
      console.log(this.mass);
      return this;
    },
    destroy: function() {
      playfield.removeChild(this.element);
      return this;
    },
    reset: function(pos) {
      this.velocity = new geometry.Vector(0, 0);
      this.rect = new geometry.Rect(pos.x - this.size / 2, pos.y - this.size / 2, this.size, this.size);
    },
    move: function(dx, dy) {
      this.velocity.add(dx * this.speed, dy * this.speed);
      return this;
    },
    update: function() {
      this.lastPos = this.rect.pos.clone();

      // Apply friction to velocity
      this.velocity.scale(this.friction);

      // Move hitbox
      this.rect.pos.add(this.velocity);

      // Check collisions with screen boundaries
      if (this.rect.left < bounds.left) {
        this.rect.left = bounds.left;
        this.velocity.x *= -1;
      }
      if (this.rect.right > bounds.right) {
        this.rect.right = bounds.right;
        this.velocity.x *= -1;
      }
      if (this.rect.top < bounds.top) {
        this.rect.top = bounds.top;
        this.velocity.y *= -1;
      }
      if (this.rect.bottom > bounds.bottom) {
        this.rect.bottom = bounds.bottom;
        this.velocity.y *= -1;
      }

      // Alter circle coordinates
      this.display();

      // Return self for method chaining
      return this;
    },
    intersects: function(other) {
      var d, m;
      d = other.rect.center.subtracted(this.rect.center);
      m = this.radius + other.radius;
      return d.x * d.x + d.y * d.y < m * m;
    },
    respond: function(other) {
      var d, n, t, c, sna, snb, sta, stb, sa, sb, snaa, snab, staa, stab;
      d = other.rect.center.subtracted(this.rect.center);
      n = d.normalized();
      t = new geometry.Vector(-n.y, n.x);
      sna = n.dotted(this.velocity);
      snb = n.dotted(other.velocity);
      sta = t.dotted(this.velocity);
      stb = t.dotted(other.velocity);
      sa = (sna * (this.mass - other.mass) + 2 * other.mass * snb) / (this.mass + other.mass);
      sb = (snb * (other.mass - this.mass) + 2 * this.mass * sna) / (other.mass + this.mass);
      snaa = n.scaled(sa);
      snab = n.scaled(sb);
      staa = t.scaled(sta);
      stab = t.scaled(stb);
      this.velocity = staa.added(snaa);
      other.velocity = stab.added(snab);

      c = new geometry.Vector((this.rect.center.x * other.radius + other.rect.center.x * this.radius) / (this.radius + other.radius), (this.rect.center.y * other.radius + other.rect.center.y * this.radius) / (this.radius + other.radius));

      this.rect.center = c.subtracted(n.scaled(this.radius + 1));
      other.rect.center = c.added(n.scaled(other.radius + 1));

      return this;
    },
    display: function() {
      // Rounding reduces number of DOM updates but looks jittery
      this.element.style.left = Math.round(this.rect.left)+"em";
      this.element.style.top  = Math.round(this.rect.top)+"em";
    }
  };

  function init() {
    key.init();
    new Circle("smallest").create({
      pos: new geometry.Vector(bounds.right * .125, bounds.bottom * .75),
      size: 16,
      color: "black"
    });
    new Circle("smaller").create({
      pos: new geometry.Vector(bounds.right * .25, bounds.bottom * .75),
      size: 32,
      color: "black"
    });
    new Circle("same").create({
      pos: new geometry.Vector(bounds.right * .375, bounds.bottom * .75),
      size: 64,
      color: "black"
    });
    new Circle("bigger").create({
      pos: new geometry.Vector(bounds.right * .625, bounds.bottom * .75),
      size: 96,
      color: "black"
    });
    new Circle("biggest").create({
      pos: new geometry.Vector(bounds.right * .875, bounds.bottom * .75),
      size: 128,
      color: "black"
    });
    function loop() {
      if (key.down(key.LEFT))
        circle.move(-1, 0);
      if (key.down(key.RIGHT))
        circle.move(1, 0);
      if (key.down(key.UP))
        circle.move(0, -1);
      if (key.down(key.DOWN))
        circle.move(0, 1);
      circles.some(function(circle){
        circle.update();
        circle.collisionList = [];
      });
      circles.some(function(circle) {
        circles.some(function(other) {
          if (circle !== other) {
            if (circle.intersects(other) && circle.collisionList.indexOf(other) == -1 && other.collisionList.indexOf(circle) == -1) {
              circle.respond(other);
            }
            circle.collisionList.push(other);
            other.collisionList.push(circle);
          }
        });
      });
      requestAnimationFrame(loop);
    }
    loop();
  }
})();

},{"./geometry":2,"./key":3}],2:[function(require,module,exports){
module.exports = (function(){
  function Vector(x, y){
    this.x = x;
    this.y = y;
  }

  Vector.resolve = function(x, y) {
    if (typeof y === "undefined") {
      var t = typeof x;
      if (x instanceof Vector) {
        y = x.y;
        x = x.x;
      } else if (typeof x === "number") {
        y = 0;
      }
    }
    return {x: x, y: y};
  }

  Vector.prototype = {
    resolve:    Vector.resolve,
    add:        function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      this.x += x;
      this.y += y;
      return this;
    },
    added:      function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      return new Vector(this.x + x, this.y + y);
    },
    subtract:   function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      this.x -= x;
      this.y -= y;
      return this;
    },
    subtracted: function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      return new Vector(this.x - x, this.y - y);
    },
    multiply: function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      this.x *= x;
      this.y *= y;
      return this;
    },
    multiplied: function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      return new Vector(this.x * x, this.y * y);
    },
    divide: function(x, y) {
      o = Vector.resolve(x, y);
      this.x /= o.x;
      this.y /= o.y;
      return this;
    },
    divided: function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      return new Vector(this.x / x, this.y / y);
    },
    dot: function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      return this.x * x + this.y * y;
    },
    normalize: function() {
      var m = this.magnitude();
      if (!m) return this;
      return this.scale(1 / m);
    },
    normalized: function() {
      var m = this.magnitude();
      if (!m) return this;
      return this.scaled(1 / m);
    },
    magnitude: function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    clone: function() {
      return new Vector(this.x, this.y);
    },
    set: function(x, y){
      o = Vector.resolve(x, y);
      this.x = o.x;
      this.y = o.y;
      return this;
    },
    equals: function(x, y){
      if (x === null) return false;
      o = Vector.resolve(x, y);
      return this.x == o.x && this.y == o.y;
    },
    floor : function() {
      this.x = Math.floor(this.x);
      this.y = Math.floor(this.y);
      return this;
    },
    floored : function() {
      return new Vector(Math.floor(this.x), Math.floor(this.y));
    },
    round : function() {
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
      return this;
    },
    rounded : function() {
      return new Vector(Math.round(this.x), Math.round(this.y));
    },
    scale: function(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      return this;
    },
    scaled: function(scalar) {
      return new Vector(this.x * scalar, this.y * scalar);
    },
    dotted: function(other) {
      return this.x * other.x + this.y * other.y;
    },
    string: function(){
      return this.x+", "+this.y;
    }
  }

  function Rect(x, y, width, height){
    var pos, size;

    if (typeof width !== "undefined" && typeof height !== "undefined"){
      pos  = new Vector(x, y);
      size = new Vector(width, height);
    } else {
      pos = x;
      size = y;
    }

    this.pos = pos;
    this.size = size;

    var property, obj;

    for (property in this.properties) {
      obj = this.properties[property];
      Object.defineProperty(this, property, obj);
    }
  }

  Rect.prototype = {
    properties: {
      "left": {
        get: function(){
          return this.pos.x;
        },
        set: function(value){
          this.pos.x = value;
        }
      },
      "right": {
        get: function(){
          return this.pos.x + this.size.x;
        },
        set: function(value){
          this.pos.x = value - this.size.x;
        }
      },
      "top": {
        get: function(){
          return this.pos.y;
        },
        set: function(value){
          this.pos.y = value;
        }
      },
      "bottom": {
        get: function(){
          return this.pos.y + this.size.y;
        },
        set: function(value){
          this.pos.y = value - this.size.y;
        }
      },
      "x": {
        get: function(){
          return this.pos.x;
        },
        set: function(value){
          this.pos.x = value;
        }
      },
      "y": {
        get: function(){
          return this.pos.y;
        },
        set: function(value){
          this.pos.y = value;
        }
      },
      "width": {
        get: function(){
          return this.size.x;
        },
        set: function(value){
          this.size.x = value;
        }
      },
      "height": {
        get: function(){
          return this.size.y;
        },
        set: function(value){
          this.size.y = value;
        }
      },
      "center": {
        get: function(){
          return new Vector(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
        },
        set: function(value){
          this.pos.x = value.x - this.size.x / 2;
          this.pos.y = value.y - this.size.y / 2;
        }
      }
    },
    added:      function(x, y) {
      o = Vector.resolve(x, y);
      x = o.x;
      y = o.y;
      return new Rect(this.pos.x + x, this.pos.y + y, this.size.x, this.size.y);
    },
    clone:      function() {
      return new Rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    },
    set:        function(x, y, width, height) {
      if (x instanceof Rect) {
        this.pos.x  = x.pos.x;
        this.pos.y  = x.pos.y;
        this.size.x = x.size.x;
        this.size.y = x.size.y;
        return;
      }
      this.pos.x = x;
      this.pos.y = y;
      this.size.x = width;
      this.size.y = height;
    },
    intersects: function(other) {
      if (other instanceof Vector) {
        return this.left < other.x && this.right > other.x && this.top < other.y && this.bottom > other.y;
      } else if (other instanceof Rect) {
        return this.left < other.right && this.right > other.left && this.top < other.bottom && this.bottom > other.top;
      } else {
        return false;
      }
    },
    contains: function(other) {
      if (other instanceof Vector) {
        return other.x > this.left && other.x < this.right && other.y > this.top && other.y < this.bottom;
      } else if (other instanceof Rect) {
        return other.left > this.left && other.right < this.right && other.top > this.top && other.bottom < this.bottom;
      } else {
        return false;
      }
    },
    string: function(){
      return this.left+" -> "+this.right+", "+this.top+" -> "+this.bottom;
    }
  };

  return {
    Vector: Vector,
    Rect: Rect
  };
})();

},{}],3:[function(require,module,exports){
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