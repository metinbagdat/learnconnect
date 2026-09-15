import { routeApiRequest } from '../server/api-router.js';

export default async function handler(req, res) {
  req.url = '/api';
  await routeApiRequest(req, res);
}
