(/**
 * Initializes a WebSocket connection and manages all related event listeners.
 * This function also handles reconnection attempts upon connection failure.
 */
function () {
  /**
   * The maximum number of reconnection attempts allowed when trying to
   * re-establish a connection, such as with a server or database. This
   * constant is used to define an upper limit to prevent infinite retry loops.
   *
   * @constant {number} MAX_RECONNECT_ATTEMPTS
   * @default 10
   */
  const MAX_RECONNECT_ATTEMPTS = 10;
  /**
   * Interval time in milliseconds to wait before attempting to reconnect.
   * This variable defines the delay period between connection retries
   * in scenarios where a connection to a service or system fails.
   *
   * @constant {number} RECONNECT_INTERVAL
   * @default 500
   */
  const RECONNECT_INTERVAL = 500; // half second
  /**
   * Represents the number of attempts made to reconnect after a disconnection.
   * This variable is typically used to track or limit the number of retry attempts
   * in scenarios involving network or connection-related operations.
   *
   * @type {number} reconnect_attempts
   */
  let reconnect_attempts = 0;

  /**
   * Represents a WebSocket connection or any other type of socket connection.
   * This variable can be used to initialize, manage, and close a connection
   * to a remote server or endpoint. It is initially set to null, indicating no
   * active socket connection.
   *
   * The value of `socket` is expected to be updated with a socket instance
   * (e.g., WebSocket or other library-specific connection objects) when
   * a connection is established.
   *
   * @type {WebSocket | null} socket
   */
  let socket = null; // Keep a single reference to the WebSocket instance

  async function get_socket_address() {
    const response = await fetch( "socket-address.json" );
    const config = await response.json();
    return config.address;
  }

  /**
     * Initializes or re-initializes the WebSocket connection.
     * This function ensures no duplicate WebSocket instances exist by
     * cleaning up any existing WebSocket connections before creating a
     * new one. It sets up event listeners to handle various WebSocket
     * events such as `open`, `message`, `error`, and `close`.
     *
     * If any errors occur during initialization, they are caught and
     * logged to the console, and the function returns `null`. On success,
     * an initialized WebSocket instance is returned.
     * @function
     * @returns {WebSocket | null} Returns the initialized WebSocket instance, or null if an error occurs.
     * @param {string | URL} [address]
     */
  function socket_init(address) {
    try {
      // Clean up the existing WebSocket instance before creating a new one
      if ( socket ) {
        socket.removeEventListener( 'open', on_open );
        socket.removeEventListener( 'message', on_message );
        socket.removeEventListener( 'error', on_error );
        socket.removeEventListener( 'close', on_close );
        socket = null; // Remove the reference
      }

      // Create a new WebSocket instance
      socket = new WebSocket( address );

      // Attach event listeners
      socket.addEventListener( 'open', on_open );
      socket.addEventListener( 'message', on_message );
      socket.addEventListener( 'error', on_error );
      socket.addEventListener( 'close', on_close );

      return socket;
    } catch ( error ) {
      console.error( 'WebSocket Initialization Error:', error );
      return null;
    }
  }

  function on_open() {
    console.log('Connected to WebSocket server');
    reconnect_attempts = 0; // Reset reconnect attempts on successful connection
    localStorage.setItem('websocket_called', 'true');
  }

  /**
     * @param {{ data: string }} event
     */
  function on_message(event) {
    try {
      const action = JSON.parse(event.data);
      console.info('WebSocket Message:', action);

      if (action.type === 'reload') {
        console.log('Reloading page as instructed by WebSocket');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
     * @param {any} error
     */
  function on_error(error) {
    console.error('WebSocket Error:', error);
  }

  function on_close() {
    console.warn('WebSocket connection closed');
    localStorage.removeItem('websocket_called');
    attempt_reconnect();
  }

  function attempt_reconnect() {
    if (reconnect_attempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached. Could not re-establish WebSocket connection.');
      return;
    }

    console.log(`Attempting to reconnect... (${reconnect_attempts+1}/${MAX_RECONNECT_ATTEMPTS})`);

    setTimeout(async () => {

      const newSocket = socket_init(await get_socket_address());
      reconnect_attempts++;

      if (newSocket && newSocket.readyState === WebSocket.OPEN) {
        console.log('WebSocket reconnected successfully');
        reconnect_attempts = 0; // Reset attempts on successful reconnect
      } else if (reconnect_attempts <= MAX_RECONNECT_ATTEMPTS) {
        attempt_reconnect(); // Try again
      }
    }, RECONNECT_INTERVAL);
  }

  // Initialize WebSocket connection on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing WebSocket connection...');
    socket_init(await get_socket_address());
  });
})();
