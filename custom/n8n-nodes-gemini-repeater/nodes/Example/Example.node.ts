import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Example implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Example',
		name: 'example',
		icon: { light: 'file:example.svg', dark: 'file:example.dark.svg' },
		group: ['input'],
		version: 1,
		description: 'Basic Example Node',
		defaults: {
			name: 'Example',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: undefined,
		properties: [],
		credentials: [
			{
				// eslint-disable-next-line @n8n/community-nodes/no-credential-reuse
				name: 'googlePalmApi',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const apiKey = (await this.getCredentials<{ apiKey: string }>('googlePalmApi')).apiKey;

		if (!apiKey) {
			throw new NodeOperationError(this.getNode(), 'No API key set in credentials');
		}

		for (let i = 0; i < items.length; i++) {
			const headers = items[i].json.headers as Record<string, string>;

			const url = headers['x-original-gemini-request-url'];
			const method = (
				headers['x-original-gemini-request-method'] || 'GET'
			).toUpperCase() as IHttpRequestMethods;
			const body = items[i].json.body;

			if (!url) {
				throw new NodeOperationError(
					this.getNode(),
					'Missing X-ORIGINAL-GEMINI-REQUEST-URL header',
				);
			}

			if (!url.startsWith('https://generativelanguage.googleapis.com/')) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid X-ORIGINAL-GEMINI-REQUEST-URL header',
				);
			}

			// TODO: Logging request sender info for monitoring

			const requestHeaders = {
				'Content-Type': 'application/json',
			};

			const fullResponse = await this.helpers
				.httpRequest({
					url: url + '?key=' + apiKey,
					method,
					headers: requestHeaders,
					body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body),
					returnFullResponse: true,
				})
				.catch((error) => {
					throw new NodeOperationError(this.getNode(), error);
				});

			// fullResponse typically contains `statusCode`, `headers`, and `body`.
			const { statusCode, headers: respHeaders, body: respBody } = fullResponse;

			returnData.push({
				json: {
					statusCode,
					headers: respHeaders instanceof Map ? Object.fromEntries(respHeaders) : respHeaders,
					body: respBody,
				},
			});
		}

		return [returnData];
	}
}
