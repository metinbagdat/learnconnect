import { routeApiRequest } from '../server/api-router.js';

export default async function handler(req, res) {
  await routeApiRequest(req, res);
}
