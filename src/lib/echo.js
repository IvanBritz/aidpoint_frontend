import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import axios from './axios'

let echo = null

if (typeof window !== 'undefined') {
    const enabled = (process.env.NEXT_PUBLIC_WS_ENABLED || 'true') === 'true'
    if (enabled) {
        const driver = process.env.NEXT_PUBLIC_BROADCAST_DRIVER || 'pusher'
        if (driver === 'pusher') {
            Pusher.Runtime.createXHR = function () { return new XMLHttpRequest() }
            echo = new Echo({
                broadcaster: 'pusher',
                key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'local',
                wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || window.location.hostname,
                wsPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT || 6001),
                wssPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT || 6001),
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
                forceTLS: (process.env.NEXT_PUBLIC_PUSHER_TLS || 'false') === 'true',
                enabledTransports: ['ws', 'wss'],
                disableStats: true,
                authEndpoint: '/broadcasting/auth',
                withCredentials: true,
                authorizer: (channel, options) => ({
                    authorize: (socketId, callback) => {
                        axios.post('/broadcasting/auth', {
                            socket_id: socketId,
                            channel_name: channel.name,
                        }).then(response => {
                            callback(false, response.data)
                        }).catch(error => {
                            callback(true, error)
                        })
                    }
                })
            })
        } else if (driver === 'reverb') {
            echo = new Echo({
                broadcaster: 'reverb',
                key: process.env.NEXT_PUBLIC_REVERB_KEY || 'local',
                wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || window.location.hostname,
                wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
                wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
                forceTLS: (process.env.NEXT_PUBLIC_REVERB_TLS || 'false') === 'true',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: '/broadcasting/auth',
                withCredentials: true,
                authorizer: (channel, options) => ({
                    authorize: (socketId, callback) => {
                        axios.post('/broadcasting/auth', {
                            socket_id: socketId,
                            channel_name: channel.name,
                        }).then(response => {
                            callback(false, response.data)
                        }).catch(error => {
                            callback(true, error)
                        })
                    }
                })
            })
        }
    }
}

export default echo
