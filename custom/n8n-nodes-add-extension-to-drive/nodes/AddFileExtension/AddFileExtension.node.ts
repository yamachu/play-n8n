import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class AddFileExtension implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Add File Extension',
		name: 'addFileExtension',
		icon: { light: 'file:example.svg', dark: 'file:example.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Add file extensions based on MIME type',
		defaults: {
			name: 'Add File Extension',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Custom MIME Mappings',
				name: 'customMappings',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'application/custom: .custom\ntext/special: .spec',
				description:
					'Additional MIME type to extension mappings (one per line, format: "mime/type: .ext")',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const customMappings = this.getNodeParameter('customMappings', 0, '') as string;

		try {
			// デフォルトのMIMEタイプから拡張子へのマッピング
			const mimeToExt: Record<string, string> = {
				'application/pdf': '.pdf',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
				'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
				'application/msword': '.doc',
				'text/plain': '.txt',
				'text/csv': '.csv',
				'image/jpeg': '.jpg',
				'image/png': '.png',
				'image/gif': '.gif',
				'application/json': '.json',
			};

			// カスタムマッピングを追加
			if (customMappings.trim()) {
				const lines = customMappings.split('\n');
				for (const line of lines) {
					const [mimeType, extension] = line.split(':').map((s) => s.trim());
					if (mimeType && extension) {
						mimeToExt[mimeType] = extension;
					}
				}
			}

			// すべてのアイテムを処理
			for (const item of items) {
				if (item.binary && item.binary.data) {
					// 現在のファイル名とMIMEタイプを取得
					const fileName = item.binary.data.fileName || 'file';
					const mimeType = item.binary.data.mimeType;

					// 拡張子がない場合は追加
					const ext = mimeToExt[mimeType] || '';
					const newFileName = fileName.includes('.') ? fileName : fileName + ext;

					// バイナリデータのファイル名を更新
					item.binary.data.fileName = newFileName;
				}
			}

			return [items];
		} catch (error) {
			if (this.continueOnFail()) {
				return [
					items.map((item) => ({
						...item,
						json: {
							...item.json,
							error: error.message,
						},
					})),
				];
			} else {
				throw new NodeOperationError(this.getNode(), error);
			}
		}
	}
}
