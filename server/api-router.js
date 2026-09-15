import path from 'path';
import { pathToFileURL } from 'url';

const API_ROOT = path.resolve(process.cwd(), 'server', 'api');

function sanitizeSegment(segment) {
	return String(segment || '').replace(/[^a-zA-Z0-9_\-\[\]]/g, '');
}

function normalizePath(pathname) {
	const stripped = pathname.replace(/^\/api\/?/, '');
	if (!stripped) {
		return '';
	}

	return stripped
		.split('/')
		.map(sanitizeSegment)
		.filter(Boolean)
		.join('/');
}

function buildCandidatePaths(normalized) {
	const parts = normalized ? normalized.split('/') : [];
	const candidates = [];

	if (!normalized) {
		candidates.push('index.js');
		return candidates;
	}

	candidates.push(`${normalized}.js`);
	candidates.push(path.join(normalized, 'index.js'));

	// Support dynamic segment folders like /tyt/tasks/123/complete => /tyt/tasks/[id]/complete.js
	for (let i = 0; i < parts.length; i += 1) {
		const maybeId = parts[i];
		if (/^\d+$/.test(maybeId)) {
			const replaced = [...parts];
			replaced[i] = '[id]';
			candidates.push(`${replaced.join('/')}.js`);
			candidates.push(path.join(replaced.join('/'), 'index.js'));
		}
	}

	return [...new Set(candidates)];
}

async function loadHandler(reqPath) {
	const normalized = normalizePath(reqPath);
	const candidates = buildCandidatePaths(normalized);

	for (const relativeFile of candidates) {
		const absoluteFile = path.resolve(API_ROOT, relativeFile);

		if (!absoluteFile.startsWith(API_ROOT)) {
			continue;
		}

		try {
			const mod = await import(pathToFileURL(absoluteFile).href);
			if (typeof mod.default === 'function') {
				return mod.default;
			}
		} catch (error) {
			if (error?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module/i.test(String(error?.message))) {
				continue;
			}
			throw error;
		}
	}

	return null;
}

function attachDynamicQuery(req, reqPath) {
	const normalized = normalizePath(reqPath);
	if (!normalized) {
		return;
	}

	const parts = normalized.split('/');
	const numericIndex = parts.findIndex((p) => /^\d+$/.test(p));
	if (numericIndex >= 0) {
		req.query = req.query || {};
		req.query.id = req.query.id || parts[numericIndex];
	}
}

export async function routeApiRequest(req, res) {
	try {
		const requestPath = req.url || '/api';
		attachDynamicQuery(req, requestPath);

		const handler = await loadHandler(requestPath);
		if (!handler) {
			res.statusCode = 404;
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({ message: 'Not Found' }));
			return;
		}

		await handler(req, res);
	} catch (error) {
		console.error('[api-router] failed', error);
		res.statusCode = 500;
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({ message: 'Internal Server Error' }));
	}
}
