var socket_io = require('socket.io');
const axios = require("axios");
var io = socket_io();
const handshakeMiddleware = require('../middleware/handshakeMiddleware');
var socketApi = {};


socketApi.io = io;

//socket middleware
// io.use((socket, next) => {
//     next();
// });

// Use the handshake middleware
io.use(handshakeMiddleware);

io.on('connection', function (socket) {

    var roomName = 'private';

    //user to fetch chat between 2 users or join room
    socket.on('get-chat-history', (data) => {

        roomName = data.room_id;

        // console.log( socket.userId )

        // Leave all previous rooms
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });

        axios.post(process.env.APP_URL + 'get-chat-history',
            {
                room_id: roomName,
                user_id: socket.userId
            })
            .then(response => {

                console.log('in response');
                // console.log(response.data.result);

                if (response.data.result == 'success') {

                    console.log('in success');
                    // Join the new room
                    socket.join(roomName);

                    io.in(roomName).emit('chat-history', {
                        'result': 'success',
                        'message': response.data.message,
                        'data': response.data.data
                    });

                } else if (response.data.result == 'error') {
                    console.log('in error');
                    socket.emit('error', {
                        'result': 'error',
                        'message': response.data.message,
                        'data': null
                    });
                }

                // console.log(response.data);


            })
            .catch(error => {
                console.log('in catch');

                if (error.response && error.response.status === 404) {

                    socket.emit('error', {
                        result: 'error',
                        message: 'No Chat Found',
                        data: null
                    });
                } else if (error.response && error.response.status === 500) {
                    console.error('Server Error From Server');
                    console.error(error.response);
                } else {
                    socket.emit({
                        'result': 'error',
                        'message': 'Error fetching chat history: ' + error,
                        'data': null
                    });
                }
            });

        // Emit the message to all connected clients
    });

    socket.on('get-conversation-list', (data) => {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            socket.leave(room);
        });

        axios.post(process.env.APP_URL + 'get-conversation-list',
            {
                user_id: socket.userId
            })
            .then(response => {
                console.log('in response');
                // console.log(response.data.result);

                if (response.data.result == 'success') {


                    io.emit(socket.userId + '-conversation-list', {
                        'result': 'success',
                        'message': response.data.message,
                        'data': response.data.data
                    });

                }

            })
            .catch(error => {
                console.log('in catch');

                if (error.response && error.response.status === 404) {

                    socket.emit('error', {
                        result: 'error',
                        message: 'No Chat Found',
                        data: null
                    });
                } else if (error.response && error.response.status === 500) {
                    console.error('Server Error From Server');
                    console.error(error.response);
                } else {
                    socket.emit({
                        'result': 'error',
                        'message': 'Error fetching chat history: ' + error,
                        'data': null
                    });
                }
            });
    });

    socket.on('send-message', (data) => {

        roomName = data.room_id;

        axios.post(process.env.APP_URL + 'send-message',
            {
                user_id: socket.userId,
                room_id: roomName,
                receiver_id: data.receiver_id,
                message: data.message
            })
            .then(response => {
                console.log('in response');
                // console.log(response.data.result);

                if (response.data.result == 'success') {

                    console.log('in success response: ' + response.data.data.room_id);

                    if (roomName == '') {
                        console.log('room join');
                        socket.join(response.data.data.room_id);

                        roomName = response.data.data.room_id;
                    }


                    // Join the new room
                    // socket.join(roomName);

                    console.log('sending message');

                    io.in(roomName).emit('save-message', {
                        'result': 'success',
                        'message': response.data.message,
                        'data': response.data.data
                    });

                }

            })
            .catch(error => {
                console.log('in catch');

                if (error.response && error.response.status === 404) {

                    socket.emit('error', {
                        result: 'error',
                        message: error.response.data.message,
                        data: null
                    });
                } else if (error.response && error.response.status === 500) {
                    console.error(error.response.message);
                    console.error(error.response);


                    socket.emit('error', {
                        result: 'error',
                        message: error.response.data.message,
                        data: null
                    });
                } else if (error.response && error.response.status === 422) {

                    socket.emit('error', {
                        result: 'error',
                        message: error.response.data.message,
                        data: null
                    });
                } else {
                    console.log(error);
                    socket.emit({
                        'result': 'error',
                        'message': 'Error in Saving Chat: ' + error.response.data.message,
                        'data': null
                    });
                }
            });
    });

    socket.on('leave-room', (data) => {
        roomName = data.room_id;
        socket.leave(roomName);

        io.emit(socket.userId + '-leave-room', {
            'result': 'success',
            'message': 'Leave Room Successfully',
            'data': null
        });
    });

    socket.on('leave-all-rooms', (data) => {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            socket.leave(room);
        });

        io.emit(socket.userId + '-leave-all-rooms', {
            'result': 'success',
            'message': 'Leave All Room Successfully',
            'data': null
        });

    });

});

module.exports = socketApi;
