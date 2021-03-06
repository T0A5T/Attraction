

# web
express = require("express")
routes = require("./routes")
http = require("http")
path = require("path")

app = express()

app.configure ->
  app.set "port", process.env.PORT or 3000
  app.set "views", __dirname + "/views"
  app.set "view engine", "jade"
  app.use express.favicon()
  app.use express.logger("dev")
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.static(path.join(__dirname, "public"))

app.configure "development", ->
  app.use express.errorHandler()

app.get "/", routes.index

http.createServer(app).listen app.get("port"), ->
  console.log "Express server listening on port " + app.get("port")


  
# game
util = require("util")
io = require("socket.io")
Player = require("./game/player").Player

# game local
socket = undefined
players = undefined


setEventHandlers = ->
  socket.sockets.on "connection", onSocketConnection


onSocketConnection = (client) ->
  util.log "New player has connected: " + client.id
  client.on "disconnect", onClientDisconnect
  client.on "new player", onNewPlayer
  client.on "move player", onMovePlayer


onClientDisconnect = ->
  util.log "Player has disconnected: " + @id
  removePlayer = playerById(@id)
  unless removePlayer
    util.log "Player not found: " + @id
    return
  players.splice players.indexOf(removePlayer), 1
  @broadcast.emit "remove player",
    id: @id

onNewPlayer = (data) ->
  newPlayer = new Player(data.x, data.y)
  newPlayer.id = @id
  @broadcast.emit "new player",
    id: newPlayer.id
    x: newPlayer.x
    y: newPlayer.y

  i = undefined
  existingPlayer = undefined
  i = 0
  while i < players.length
    existingPlayer = players[i]
    @emit "new player",
      id: existingPlayer.id
      x: existingPlayer.x
      y: existingPlayer.y

    i++
  players.push newPlayer


onMovePlayer = (data) ->
  movePlayer = playerById(@id)
  
  unless movePlayer
    util.log "Player not found: " + @id
    return
  
  movePlayer.x = data.x
  movePlayer.y = data.y
  
  @broadcast.emit "move player",
    id: movePlayer.id
    x: movePlayer.x
    y: movePlayer.y


playerById = (id) ->
  i = undefined
  i = 0
  while i < players.length
    return players[i]  if players[i].id is id
    i++
  false


init = ->
  players = []
  socket = io.listen(8000)

  socket.configure ->
    socket.set "transports", ["websocket"]
    socket.set "log level", 2

  setEventHandlers()


# entry point
init()
