/**
 * Handles the index route.
 *
 * @param {import("@nutsloop/ivy-server").IncomingMessage} _req - The incoming request object.
 * @param {import("@nutsloop/ivy-server").ServerResponse} _res - The outgoing response object.
 * @return {Promise<Buffer>}
 */
export async function index( _req, _res ){
  return Buffer.from( 'Hello World!!!!' );
}
