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
