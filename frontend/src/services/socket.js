socketInstance = io(SOCKET_SERVER_URL, {
  auth: (cb) => cb({ token: localStorage.getItem('boardly_token') }),
  autoConnect: false,
  // ...existing options
});