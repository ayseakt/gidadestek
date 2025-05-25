// src/services/orderService.js

import api from './api'; // Axios instance'ı burada tanımlı olmalı

const orderService = {
  getOrders: () => {
    return api.get('/orders');
  },

  getOrderById: (id) => {
    return api.get(`/orders/${id}`);
  },

  verifyOrder: (orderId, verificationCode) => {
    return api.post(`/orders/${orderId}/verify`, { verificationCode });
  },

  cancelOrder: (orderId) => {
    return api.post(`/orders/${orderId}/cancel`);
  }
};

export default orderService;
