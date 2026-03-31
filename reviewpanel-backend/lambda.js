import serverlessExpress from '@vendia/serverless-express';
import app from './server.js';

// Initialize the serverless-express handler once and reuse across invocations
const server = serverlessExpress({ app });

const stripStagePrefix = (path, stage) => {
	if (!path || !stage) {
		return path;
	}

	const stagePrefix = `/${stage}`;

	if (path === stagePrefix) {
		return '/';
	}

	if (path.startsWith(`${stagePrefix}/`)) {
		return path.slice(stagePrefix.length);
	}

	return path;
};

const normalizeApiGatewayEvent = (event) => {
	const stage = event?.requestContext?.stage;

	if (!stage) {
		return event;
	}

	if (event.path) {
		event.path = stripStagePrefix(event.path, stage);
	}

	if (event.rawPath) {
		event.rawPath = stripStagePrefix(event.rawPath, stage);
	}

	if (event.requestContext?.path) {
		event.requestContext.path = stripStagePrefix(event.requestContext.path, stage);
	}

	if (event.requestContext?.http?.path) {
		event.requestContext.http.path = stripStagePrefix(event.requestContext.http.path, stage);
	}

	if (event.pathParameters?.proxy) {
		event.pathParameters.proxy = stripStagePrefix(`/${event.pathParameters.proxy}`, stage).replace(/^\//, '');
	}

	return event;
};

// Wrap the vendia handler to ensure a clean Lambda invocation and add diagnostics.
// Setting callbackWaitsForEmptyEventLoop = false allows the function to return
// even if there are background sockets/open handles created by some libraries.
export const handler = async (event, context) => {
	// Avoid waiting for the node event loop to be empty before returning
	context.callbackWaitsForEmptyEventLoop = false;

	const normalizedEvent = normalizeApiGatewayEvent(event);

	console.log('▶ Lambda handler invoked', {
		stage: normalizedEvent?.requestContext?.stage || 'none',
		route: normalizedEvent?.path || normalizedEvent?.requestContext?.http?.path || 'unknown',
		method: normalizedEvent?.httpMethod || normalizedEvent?.requestContext?.http?.method || 'unknown'
	});

	// Handle preflight OPTIONS requests directly at Lambda level
	if (event?.requestContext?.http?.method === 'OPTIONS' || event?.httpMethod === 'OPTIONS') {
		console.log('◀ Lambda handler: Returning CORS preflight response');
		return {
			statusCode: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Max-Age': '86400',
			},
			body: '',
		};
	}

	try {
		const result = await server(normalizedEvent, context);

		// Ensure CORS headers are present in the response
		if (result && result.headers) {
			result.headers['Access-Control-Allow-Origin'] = '*';
			result.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
			result.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
		}

		console.log('◀ Lambda handler completed');
		return result;
	} catch (err) {
		console.error('❌ Lambda handler error', err);
		throw err;
	}
};