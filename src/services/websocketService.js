import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws/booking'; // Thay đổi domain tùy môi trường

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
  }

  connect(onConnect, onError) {
    if (this.client && this.client.connected) {
      if (onConnect) onConnect();
      return;
    }

    this.client = new Client({
      // Dùng SockJS nếu cần fallback
      webSocketFactory: () => new SockJS(SOCKET_URL),
      debug: function (str) {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000, // Tự động reconnect sau 5s
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      if (onConnect) onConnect();
      
      // Resubscribe lại các kênh cũ nếu bị đứt kết nối
      this.subscriptions.forEach((callback, destination) => {
        this._subscribeInternal(destination, callback);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      if (onError) onError(frame);
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      console.log('Disconnected');
    }
  }

  _subscribeInternal(destination, callback) {
    if (this.client && this.client.connected) {
      this.client.subscribe(destination, (message) => {
        if (message.body) {
          try {
            const body = JSON.parse(message.body);
            callback(body);
          } catch (e) {
            callback(message.body);
          }
        } else {
          callback(null);
        }
      });
    }
  }

  subscribeToSeatMap(showtimeId, callback) {
    const destination = `/topic/showtimes/${showtimeId}/seats`;
    this.subscriptions.set(destination, callback);
    this._subscribeInternal(destination, callback);
  }

  unsubscribeFromSeatMap(showtimeId) {
    const destination = `/topic/showtimes/${showtimeId}/seats`;
    this.subscriptions.delete(destination);
    // STOMPJS 5 tự động quản lý unsubscribe qua StompSubscription return từ subscribe. 
    // Do cách implement hiện tại đơn giản, ta chỉ xóa khỏi danh sách.
  }
}

const websocketService = new WebSocketService();
export default websocketService;
