(function() {
  var socket = io(),
      circles = [],
      circle,
      playfield = $(".playfield")[0],
      geometry = require("./geometry"),
      key = require("./key"),
      bounds = new geometry.Rect(0, 0, 640, 480);

  function add(data, index) {
    var item = new Circle(data).create();
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

  function Circle(data) {
    this.controls = {};
    this.speed = .075;
    this.friction = .99;
    this.rect = null;
    this.velocity = null;
    this.id = data.id;
    this.element = document.createElement("div");
    this.element.classList.add("circle");
    this.element.id = data.id;
    this.element.style.backgroundColor = data.color;
    this.element.style.width  = this.size+"em";
    this.element.style.height = this.size+"em";
    circles.push(this);
  }

  Circle.prototype = {
    size: 64,
    create: function(x, y) {
      this.reset(x, y);
      playfield.appendChild(this.element);
      return this;
    },
    destroy: function() {
      playfield.removeChild(this.element);
      return this;
    },
    reset: function(x, y) {
      o = geometry.Vector.resolve(x, y);
      o.x = o.x != null ? o.x : bounds.center.x - this.size / 2;
      o.y = o.y != null ? o.y : bounds.center.y / 2 - this.size / 2;
      this.velocity = new geometry.Vector(0, 0);
      this.rect = new geometry.Rect(o.x, o.y, this.size, this.size);
    },
    move: function(dx, dy) {
      this.velocity.add(dx * this.speed, dy * this.speed);
      return this;
    },
    update: function() {
      // Apply friction to velocity
      this.velocity.scale(this.friction);

      // Move hitbox
      this.rect.pos.add(this.velocity);

      // Collision checks (only boundary checks, currently)
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
    display: function() {
      this.element.style.left = Math.round(this.rect.pos.x)+"em";
      this.element.style.top  = Math.round(this.rect.pos.y)+"em";
    }
  };

  function init() {
    key.init();
    new Circle({
      id: "center",
      color: "black"
    }).create(bounds.center.x - Circle.prototype.size / 2, bounds.bottom * .75 - Circle.prototype.size / 2);
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
      });
      requestAnimationFrame(loop);
    }
    loop();
  }
})();
