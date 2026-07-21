import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { API_BASE_URL } from './api'

const SOCKET_URL = `${API_BASE_URL === '/' ? '' : API_BASE_URL}/ws/booking`

class WebSocketService {
  constructor() {
    this.client = null
    this.subscriptions = new Map()
    this.activeSubscriptions = new Map()
  }

  connect(onConnect, onError) {
    if (this.client?.connected) {
      onConnect?.()
      return
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      debug: import.meta.env.DEV ? (message) => console.debug('STOMP:', message) : () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    this.client.onConnect = () => {
      onConnect?.()
      this.subscriptions.forEach((callback, destination) => {
        this._subscribeInternal(destination, callback)
      })
    }

    this.client.onStompError = (frame) => {
      if (import.meta.env.DEV) {
        console.error('STOMP broker error:', frame.headers?.message)
      }
      onError?.(frame)
    }

    this.client.activate()
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate()
    }
  }

  _subscribeInternal(destination, callback) {
    if (!this.client?.connected) return

    if (this.activeSubscriptions.has(destination)) {
      this.activeSubscriptions.get(destination).unsubscribe()
    }

    const subscription = this.client.subscribe(destination, (message) => {
      if (!message.body) {
        callback(null)
        return
      }

      try {
        callback(JSON.parse(message.body))
      } catch {
        callback(message.body)
      }
    })

    this.activeSubscriptions.set(destination, subscription)
  }

  subscribeToSeatMap(showtimeId, callback) {
    const destination = `/topic/showtimes/${showtimeId}/seats`
    this.subscriptions.set(destination, callback)
    this._subscribeInternal(destination, callback)
  }

  unsubscribeFromSeatMap(showtimeId) {
    const destination = `/topic/showtimes/${showtimeId}/seats`
    this.subscriptions.delete(destination)

    if (this.activeSubscriptions.has(destination)) {
      this.activeSubscriptions.get(destination).unsubscribe()
      this.activeSubscriptions.delete(destination)
    }
  }

  sendSeatToggle(showtimeId, seatId, isSelected) {
    if (this.client?.connected) {
      this.client.publish({
        destination: `/app/showtimes/${showtimeId}/seats/toggle`,
        body: JSON.stringify({ seatId, isSelected }),
      })
    }
  }
}

const websocketService = new WebSocketService()
export default websocketService
