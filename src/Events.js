var l = console.log

var jwt = require('jsonwebtoken');
var Message = require('./models/Message');
var options = {
    secret: "test",
    timeout: 5000, // 5 seconds to send the authentication message
    algorithm: 'HS256'
}
var jwt = require('jsonwebtoken');
var token
const jwtsecret = "test"



const REDIS_HOST = 'localhost';
const REDIS_PORT = '6379';
const redis = require('redis');
var client = redis.createClient();
client.on("error", function(err) {
    console.log("Error " + err);
});


exports = module.exports = function(io) {
    io.on('connection', function(socket) {
        console.log("*******socket.io connect*******")


        token = jwt.sign({
            user: 'owner1',
            room: "room1"
        }, jwtsecret);
        socket.emit('jwt-owner1', token);

        token = jwt.sign({
            user: 'owner2',
            room: "room2"
        }, jwtsecret);
        socket.emit('jwt-owner2', token);

        token = jwt.sign({
            user: 'customer1',
            room: "room1"
        }, jwtsecret);
        socket.emit('jwt-customer1', token);

        token = jwt.sign({
            user: 'customer2',
            room: "room1"
        }, jwtsecret);
        socket.emit('jwt-customer2', token);

        token = jwt.sign({
            user: 'customer3',
            room: "room1"
        }, jwtsecret);
        socket.emit('jwt-customer3', token);

        token = jwt.sign({
            user: 'customer4',
            room: "room1"
        }, jwtsecret);
        socket.emit('jwt-customer4', token);




        delete io.sockets.connected[socket.id];



        var auth_timeout = setTimeout(function() {
            socket.disconnect('unauthorized');
            console.log("auth_timeout")
            w("error")
        }, 200000);



        var authenticate = function(data) {
            clearTimeout(auth_timeout);
            jwt.verify(data.token, options.secret, options, function(err, decoded) {
                if (err) {
                    socket.disconnect('unauthorized')
                    console.log("authorize failed")
                }
                if (!err && decoded) {
                    io.sockets.connected[socket.id] = socket

                    l("authorize succeed ")
                    socket.emit('authenticated')

                    l("auth client socket id:  ", socket.id)
                    l("jwt payload:  ", decoded)


                    if (decoded.user === "owner1") {
                        client.sadd(decoded["room"], socket.id);
                        l("you are owner1")
                    } else if (decoded.user === "owner2") {
                        client.sadd(decoded["room"], socket.id);
                        l("you are owner2")
                    } else {
                        l("you are customer")
                    }

                    socket.decoded_token = decoded
                    socket.connectedAt = new Date()
                    socket.join(decoded["room"])
                    socket.join("test")


                    socket.on('disconnect', function() {
                        client.srem(decoded.room, socket.id);
                        l('auth client: disconnected: ', socket.id)
                    })


                    socket.on('customer number', function(channel) {
                        socket.emit('replay customer number', socket.adapter.rooms[decoded["room"]])
                    });


                    socket.on('owner number', function(channel) {
                        client.smembers(decoded["room"], function(err, val) {
                            socket.emit('replay owner number', val);
                        })
                    })


                    socket.on('new message', function(msg) {
                        socket.to('room2').emit('new bc message', msg);
                    });

                    socket.on('new channel', function(channel) {
                        socket.broadcast.emit('new channel', channel)
                    });

                    socket.on('broad', function(channel) {
                        socket.broadcast.emit('new channel', channel)
                    });


                    socket.on('id msg', function(msg) {
                        socket.to(msg[1].id).emit('gg', {
                            test: "msg2 ok"
                        })
                    });




                    socket.on('get room people at o', function() {
                        socket.emit('reply room people at o', socket.adapter.rooms[decoded["room"]])
                    });


                    socket.on('c send msg at c', function(msg) {
                        l("<<<<<<c send msg at o<<<<<<\n", msg, "<<<<<<c send msg at o<<<<<<\n")
                        console.log(decoded)
                        let currentDate = new Date();
                        var Msg = new Message({
                            id: msg["id"],
                            time: msg["time"],
                            body: msg["body"],
                            user: decoded["user"],
                            room: decoded["room"]
                        });
                        Msg.save((err) => {
                            if (err) throw err;
                            console.log('c msg saved successfully');
                        });
                        client.smembers(decoded["room"], function(err, messages) {
                            messages.forEach(function(val, index, ar) {
                                socket.to(val).emit('c send msg at o', {
                                    body: msg["body"],
                                    user: decoded["user"],
                                    room: decoded["room"]
                                })
                            })
                        })
                    })



                    socket.on('o send msg to all c at o', function(msg) {
                        l("<<<<<<o send msg to all c at o<<<<<<\n", msg, "<<<<<<o send msg to all c at o<<<<<<\n")
                        let currentDate = new Date();
                        console.log(decoded)
                        var Msg = new Message({
                            id: msg["id"],
                            time: msg["time"],
                            body: msg["body"],
                            user: decoded["user"],
                            room: decoded["room"]
                        });
                        Msg.save((err) => {
                            if (err) throw err;
                            console.log('o msg saved successfully');
                        });
                        socket.to(decoded["room"]).emit('o send msg to all c at c', {
                            body: msg["body"],
                            user: decoded["user"],
                            room: decoded["room"]
                        })
                    })


                    socket.on('o send msg to a c at o', function(msg) {
                        l("<<<<<<o send msg to a c at o<<<<<<\n", msg, "<<<<<<o send msg to a c at o<<<<<<\n")
                        let currentDate = new Date();
                        console.log(decoded)
                        var Msg = new Message({
                            id: msg["id"],
                            time: msg["time"],
                            body: msg["body"],
                            user: decoded["user"],
                            room: decoded["room"],
                            to: msg["socket_id"]
                        });
                        Msg.save((err) => {
                            if (err) throw err;
                            console.log('o msg saved successfully');
                        });

                        socket.to(msg["socket_id"]).emit('o send msg to all c at c', {
                            body: msg["body"],
                            user: decoded["user"],
                            room: decoded["room"]
                        })


                    })



                    socket.on('o get initial msg at o', function(msg) {
                        socket.to(msg[1].id).emit('gg', {
                            test: "msg2 ok"
                        })
                    });


                    socket.on('c get initial msg at c', function(msg) {
                        socket.to(msg[1].id).emit('gg', {
                            test: "msg2 ok"
                        })
                    });






                }
            })
        }

        socket.on('test', function(channel) {
            console.log("no auth test ok")
        });

        socket.emit('socketid', socket.id);

        socket.on('authenticate', authenticate);

    })
};