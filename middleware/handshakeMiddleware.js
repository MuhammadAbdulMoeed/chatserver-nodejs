const axios = require('axios');

// Function to validate user ID with the database server
async function validateUserWithDatabase(headers) {
    try {
        const response = await axios.post(process.env.APP_URL+'validate-user', null, {
            headers: {
                Authorization: 'Bearer '+ headers.authorization,
            },
        });
        console.log('auth done: '+response.data.userId);
        return response.data.userId; // Assuming the database server returns { userId: '...' }
    } catch (error) {
        console.log(error);
        throw new Error('User validation failed');
    }
}

async function handshakeMiddleware(socket, next) {
    try {
        const userId = await validateUserWithDatabase(socket.handshake.headers);
        socket.userId = userId; // Attach the user ID to the socket object
        next(); // Proceed to the next middleware or to the connection event
    } catch (error) {
        console.error('Handshake error:', error);
        next(new Error('Authentication error'));
    }
}

module.exports = handshakeMiddleware;
