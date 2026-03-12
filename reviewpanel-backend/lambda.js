import serverlessExpress from '@vendia/serverless-express';
import app from './server.js';

// Initialize the serverless-express handler once and reuse across invocations
const server = serverlessExpress({ app });

// Wrap the vendia handler to ensure a clean Lambda invocation and add diagnostics.
// Setting callbackWaitsForEmptyEventLoop = false allows the function to return
// even if there are background sockets/open handles created by some libraries.
export const handler = async (event, context) => {
	// Avoid waiting for the node event loop to be empty before returning
	context.callbackWaitsForEmptyEventLoop = false;

	console.log('▶ Lambda handler invoked', {
		route: event?.path || event?.requestContext?.http?.path || 'unknown',
		method: event?.httpMethod || event?.requestContext?.http?.method || 'unknown'
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
		const result = await server(event, context);
		
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