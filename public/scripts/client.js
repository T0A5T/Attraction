// Generated by CoffeeScript 1.4.0
(function() {
  var Camera, Engine, Input, Map, NetworkClient, Player,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    var hasPerformance, lastTime, max, rAF, startTime, vendors, x;
    lastTime = 0;
    vendors = ["ms", "moz", "webkit", "o"];
    hasPerformance = !!(window.performance && window.performance.now);
    x = 0;
    max = vendors.length;
    while (x < max && !window.requestAnimationFrame) {
      window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
      window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"];
      x += 1;
    }
    if (!window.requestAnimationFrame) {
      console.log("Polyfill");
      window.requestAnimationFrame = function(callback, element) {
        var currTime, id, timeToCall;
        currTime = new Date().getTime();
        timeToCall = Math.max(0, 16 - (currTime - lastTime));
        id = window.setTimeout(function() {
          return callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        return clearTimeout(id);
      };
    }
    if (!hasPerformance) {
      console.log("performance not supported");
      rAF = window.requestAnimationFrame;
      startTime = new Date;
      window.requestAnimationFrame = function(callback, element) {
        var wrapped;
        wrapped = function(timestamp) {
          var performanceTimestamp;
          performanceTimestamp = (timestamp < 1e12 ? timestamp : timestamp - startTime);
          return callback(performanceTimestamp);
        };
        return rAF(wrapped, element);
      };
    } else {
      console.log("performance supported");
    }
    return null;
  })();

  Camera = (function() {

    function Camera(x, y) {
      this.x = x;
      this.y = y;
    }

    return Camera;

  })();

  Input = (function() {

    function Input() {
      this.update = __bind(this.update, this);

    }

    Input.prototype.keys = [100];

    Input.prototype.update = function(e) {
      if (e.type === "keyup") {
        this.keys[e.which] = false;
      }
      if (e.type === "keydown") {
        this.keys[e.which] = true;
      }
    };

    return Input;

  })();

  Player = (function() {

    Player.prototype.id = 0;

    Player.prototype.x = 0;

    Player.prototype.y = 0;

    Player.prototype.newX = 0;

    Player.prototype.newY = 0;

    Player.prototype.dx = 0;

    Player.prototype.dy = 0;

    Player.prototype.runSpeed = 0.23;

    Player.prototype.jumpSpeed = 0.36;

    Player.prototype.airSpeed = 0.01;

    Player.prototype.gravity = 0.023;

    Player.prototype.width = 30;

    Player.prototype.height = 30;

    Player.prototype.jumping = false;

    Player.prototype.grounded = false;

    Player.prototype.image = void 0;

    function Player(x, y) {
      this.x = x;
      this.y = y;
      this.newX = this.x;
      this.newY = this.y;
      this.image = new Image;
      this.image.src = "/images/sprites/player_30.png";
    }

    Player.prototype.tick = function(delta) {
      this.grounded = Engine.map.entityGrounded(this);
      if (Engine.input.keys[37]) {
        this.dx = -0.23;
      } else if (Engine.input.keys[39]) {
        this.dx = 0.23;
      } else {
        this.dx = 0;
      }
      if (Engine.input.keys[65] && this.grounded) {
        this.grounded = false;
        this.jumping = true;
        this.dy -= this.jumpSpeed;
      } else {
        if (!Engine.input.keys[65]) {
          this.jumping = false;
        }
      }
      if (this.jumping) {
        this.dy -= this.airSpeed;
        if (this.dy > 0) {
          this.jumping = false;
        }
      }
      if (!this.grounded) {
        this.dy += this.gravity;
      }
      this.newX = this.dx * delta;
      this.newY = this.dy * delta;
    };

    Player.prototype.render = function(camera) {
      Engine.context.fillStyle = "rgb(255,0,0)";
      Engine.context.beginPath();
      Engine.context.rect(-camera.x + this.x, -camera.y + this.y, this.width, this.height);
      Engine.context.closePath();
      Engine.context.fill();
      Engine.context.fillStyle = "blue";
      Engine.context.font = "bold 12px Arial";
      Engine.context.fillText(this.grounded, 5, 15);
      Engine.context.fillStyle = "blue";
      Engine.context.font = "bold 12px Arial";
      Engine.context.fillText(this.jumping, 5, 30);
    };

    return Player;

  })();

  Map = (function() {

    Map.prototype.player = void 0;

    Map.prototype.tileSize = 40;

    Map.prototype.height = 0;

    Map.prototype.width = 0;

    Map.prototype.tiles = void 0;

    Map.prototype.entities = [];

    Map.prototype.camera = void 0;

    function Map(map) {
      var x, y;
      this.height = map.length;
      this.width = map[0].length;
      this.tiles = [this.width];
      this.camera = new Camera(-(Engine.canvasWidth - this.tileSize * this.width) / 2, -(Engine.canvasHeight - this.tileSize * this.height) / 2);
      x = 0;
      while (x < this.width) {
        this.tiles[x] = [this.height];
        y = 0;
        while (y < this.height) {
          if (map[y].charAt(x) === "#") {
            this.tiles[x][y] = 1;
          } else if (map[y].charAt(x) === "P") {
            this.player = new Player(x * this.tileSize, y * this.tileSize);
            this.entities.push(this.player);
          } else {
            this.tiles[x][y] = 0;
          }
          y++;
        }
        x++;
      }
    }

    Map.prototype.tick = function(delta) {
      var i;
      i = 0;
      while (i < this.entities.length) {
        this.entities[i].tick(delta);
        this.moveEntity(this.entities[i], this.entities[i].x + this.entities[i].newX, this.entities[i].y, 1);
        this.moveEntity(this.entities[i], this.entities[i].x, this.entities[i].y + this.entities[i].newY, 0);
        i++;
      }
    };

    Map.prototype.moveEntity = function(entity, newX, newY, type) {
      var x, xe, xf, xs, xt, y, ye, yf, ys, yt;
      xf = Math.min(entity.x, newX);
      xt = Math.max(entity.x, newX) + entity.width - 1;
      yf = Math.min(entity.y, newY);
      yt = Math.max(entity.y, newY) + entity.height - 1;
      xs = Math.floor(xf / this.tileSize);
      xe = Math.floor(xt / this.tileSize);
      ys = Math.floor(yf / this.tileSize);
      ye = Math.floor(yt / this.tileSize);
      y = ys;
      while (y <= ye) {
        x = xs;
        while (x <= xe) {
          if (this.tiles[x][y] === 1) {
            if (type === 0) {
              if (entity.dy > 0) {
                entity.y = y * this.tileSize - entity.height;
                entity.grounded = true;
              } else {
                if (entity.dy < 0) {
                  entity.y = y * this.tileSize + this.tileSize;
                }
              }
              entity.dy = 0;
            } else if (type === 1) {
              if (entity.dx > 0) {
                entity.x = x * this.tileSize - entity.width;
              } else {
                if (entity.dx < 0) {
                  entity.x = x * this.tileSize + this.tileSize;
                }
              }
              entity.dx = 0;
            }
            return;
          } else {
            entity.x = newX;
            entity.y = newY;
          }
          x++;
        }
        y++;
      }
    };

    Map.prototype.entityGrounded = function(entity) {
      var x, xe, xs, ye;
      xs = Math.floor(entity.x / this.tileSize);
      xe = Math.floor((entity.x + entity.width - 1) / this.tileSize);
      ye = Math.floor((entity.y + entity.height + 1) / this.tileSize);
      if (ye > this.height - 1) {
        return true;
      }
      x = xs;
      while (x <= xe) {
        if (this.tiles[x][ye] === 1) {
          return true;
        }
        x++;
      }
      return false;
    };

    Map.prototype.render = function() {
      var i, x, y;
      Engine.context.fillStyle = "rgb(0,0,0)";
      y = 0;
      while (y < this.height) {
        x = 0;
        while (x < this.width) {
          if (this.tiles[x][y] === 1) {
            Engine.context.beginPath();
            Engine.context.rect(-this.camera.x + x * this.tileSize, -this.camera.y + y * this.tileSize, this.tileSize, this.tileSize);
            Engine.context.closePath();
            Engine.context.fill();
          }
          x++;
        }
        y++;
      }
      i = 0;
      while (i < this.entities.length) {
        this.entities[i].render(this.camera);
        i++;
      }
      i = 0;
      while (i < Engine.remotePlayers.length) {
        Engine.remotePlayers[i].render(this.camera);
        i++;
      }
    };

    return Map;

  })();

  NetworkClient = (function() {

    function NetworkClient() {}

    NetworkClient.prototype.onSocketConnected = function() {
      console.log("connected to server");
      Engine.socket.emit("new player", {
        x: Engine.map.player.x,
        y: Engine.map.player.y
      });
    };

    NetworkClient.prototype.onSocketDisconnect = function() {
      console.log("disconnected from server");
    };

    NetworkClient.prototype.onNewPlayer = function(data) {
      var player;
      console.log("new player connected: " + data.id);
      player = new Player(data.x, data.y);
      player.id = data.id;
      Engine.remotePlayers.push(player);
    };

    NetworkClient.prototype.onMovePlayer = function(data) {
      var player;
      player = this.playerById(data.id);
      if (!player) {
        console.log("player not found: " + data.id);
        return;
      }
      player.x = data.x;
      player.y = data.y;
    };

    NetworkClient.prototype.onRemovePlayer = function(data) {
      var removePlayer;
      removePlayer = this.playerById(data.id);
      if (!removePlayer) {
        console.log("Player not found: " + data.id);
        return;
      }
      Engine.remotePlayers.splice(Engine.remotePlayers.indexOf(removePlayer), 1);
    };

    NetworkClient.prototype.playerById = function(id) {
      var i;
      i = void 0;
      i = 0;
      while (i < Engine.remotePlayers.length) {
        if (Engine.remotePlayers[i].id === id) {
          return Engine.remotePlayers[i];
        }
        i++;
      }
      false;
      return null;
    };

    return NetworkClient;

  })();

  Engine = (function() {

    function Engine() {}

    Engine.canvas = void 0;

    Engine.context = void 0;

    Engine.canvasWidth = void 0;

    Engine.canvasHeight = void 0;

    Engine.lastTime = 0;

    Engine.delta = 0;

    Engine.input = new Input;

    Engine.map = void 0;

    Engine.camera = void 0;

    Engine.deltaSum = 0;

    Engine.deltaAccum = 0;

    Engine.deltaAverage = 0;

    Engine.ticks = 0;

    Engine.frames = 0;

    Engine.tps = 0;

    Engine.fps = 0;

    Engine.frameTime = 1000 / 60;

    Engine.maxFrameTime = Math.round(Engine.frameTime * 3);

    Engine.remotePlayers = [];

    Engine.multiplayer = false;

    Engine.socket;

    Engine.serverIP = 0;

    Engine.networkClient = new NetworkClient;

    Engine.tick = function(delta) {
      Engine.ticks++;
      Engine.map.tick(delta);
      if (Engine.multiplayer) {
        Engine.socket.emit("move player", {
          x: Engine.map.player.x,
          y: Engine.map.player.y
        });
      }
    };

    Engine.render = function() {
      Engine.context.save();
      Engine.context.setTransform(1, 0, 0, 1, 0, 0);
      Engine.context.clearRect(0, 0, Engine.canvas.width, Engine.canvas.height);
      Engine.context.restore();
      Engine.map.render();
      Engine.context.fillStyle = "red";
      Engine.context.font = "bold 12px Arial";
      Engine.context.fillText("fps: " + Engine.fps, Engine.canvasWidth - 100, 15);
      Engine.context.fillText("delta avg: " + Engine.deltaAverage.toFixed(2), Engine.canvasWidth - 100, 30);
    };

    Engine.setEventHandlers = function() {
      Engine.socket.on("connect", this.networkClient.onSocketConnected);
      Engine.socket.on("disconnect", this.networkClient.onSocketDisconnect);
      Engine.socket.on("new player", this.networkClient.onNewPlayer);
      Engine.socket.on("move player", this.networkClient.onMovePlayer);
      Engine.socket.on("remove player", this.networkClient.onRemovePlayer);
    };

    Engine.init = function() {
      var level1, level2;
      level1 = ["###########", "#         #", "#  P      #", "#         #", "#      #  #", "#      #  #", "###    #  #", "#     ##  #", "#         #", "###########"];
      level2 = ["##########", "#        #", "#  ###   #", "#   ##   #", "# P     ##", "#      ###", "##########"];
      Engine.map = new Map(level2);
      Engine.run(0);
    };

    Engine.run = function(timestamp) {
      requestAnimationFrame(Engine.run);
      Engine.delta = timestamp - Engine.lastTime;
      Engine.lastTime = timestamp;
      Engine.tick(Engine.delta);
      Engine.render();
      Engine.deltaSum += Engine.delta;
      if (Engine.deltaSum > 1000) {
        Engine.deltaAverage = Engine.deltaSum / Engine.ticks;
        Engine.deltaSum = 0;
        Engine.fps = Engine.ticks;
        Engine.ticks = 0;
      }
    };

    return Engine;

  })();

  $(document).ready(function() {
    var canvas, canvasJquery;
    $('#connect').click(function() {
      Engine.serverIP = $('#server').val();
      console.log(Engine.serverIP);
      Engine.socket = io.connect('http://' + Engine.serverIP, {
        port: 8000,
        transports: ["websocket"]
      });
      Engine.remotePlayers = [];
      Engine.multiplayer = true;
      return Engeine.setEventHandlers();
    });
    Engine.canvasWidth = 400;
    Engine.canvasHeight = 400;
    canvasJquery = $("<canvas id='canvas' width='" + Engine.canvasWidth + "' height='" + Engine.canvasHeight + "'></canvas>");
    Engine.canvas = canvasJquery.get(0);
    Engine.context = Engine.canvas.getContext("2d");
    canvasJquery.appendTo("body");
    canvas = $('#canvas');
    console.log(canvas[0].offsetLeft);
    console.log(canvas[0].offsetTop);
    Engine.init();
    $(document).bind("keydown", Engine.input.update);
    $(document).bind("keyup", Engine.input.update);
    $(document).bind("click", function(e) {
      return console.log("click " + e.clientX + " " + e.clientY);
    });
    $(document).bind("mousedown", function(e) {
      return console.log("mousedown " + e.clientX + " " + e.clientY);
    });
    $(document).bind("mouseup", function(e) {
      return console.log("mouseup " + e.clientX + " " + e.clientY);
    });
  });

}).call(this);
