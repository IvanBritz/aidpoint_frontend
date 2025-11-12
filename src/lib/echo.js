import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import axios from './axios'

let echo = null

// Disable WebSocket connections - notifications work via API polling
if (typeof window !== 'undefined') {
    console.log('Echo/WebSocket disabled - using API polling for notifications')
}

export default echo
