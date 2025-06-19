// Mock Socket Service for serverless backend (using polling instead of WebSockets)
class MockSocketService {
  constructor() {
    this.listeners = new Map();
    this.pollingIntervals = new Map();
    this.isConnected = false;
  }

  connect() {
    if (!this.isConnected) {
      this.isConnected = true;
      console.log('Connected to server (polling mode)');
      
      this.startPolling();
    }
    return this;
  }

  disconnect() {
    this.isConnected = false;
    console.log('Disconnected from server');
    
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
  }

  joinDisaster(disasterId) {
    if (this.isConnected) {
      console.log(`Joined disaster room: ${disasterId} (polling mode)`);
      
      this.startDisasterPolling(disasterId);
    }
  }

  leaveDisaster(disasterId) {
    if (this.isConnected) {
      console.log(`Left disaster room: ${disasterId}`);
      
      if (this.pollingIntervals.has(disasterId)) {
        clearInterval(this.pollingIntervals.get(disasterId));
        this.pollingIntervals.delete(disasterId);
      }
    }
  }

  // Event listener management
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket listener:', error);
        }
      });
    }
  }

  // Polling methods
  startPolling() {
    const interval = setInterval(() => {
      if (this.isConnected) {
        this.simulateUpdates();
      }
    }, 30000);
    
    this.pollingIntervals.set('general', interval);
  }

  startDisasterPolling(disasterId) {
    const interval = setInterval(() => {
      if (this.isConnected) {
        this.simulateDisasterUpdates(disasterId);
      }
    }, 15000);
    
    this.pollingIntervals.set(disasterId, interval);
  }

  simulateUpdates() {
    const events = ['disaster_created', 'disaster_updated', 'social_media_updated'];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    if (Math.random() < 0.1) {
      this.notifyListeners(randomEvent, {
        id: 'mock-event-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: randomEvent
      });
    }
  }

  simulateDisasterUpdates(disasterId) {
    const events = ['disaster_updated', 'social_media_updated', 'resources_updated'];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    if (Math.random() < 0.05) {
      this.notifyListeners(randomEvent, {
        disasterId,
        id: 'mock-disaster-event-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: randomEvent
      });
    }
  }

  // Manual trigger for testing
  triggerEvent(event, data) {
    this.notifyListeners(event, data);
  }
}

export default new MockSocketService(); 