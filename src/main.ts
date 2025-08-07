import {Notice, Plugin} from 'obsidian';
import CardifySettingTab from "./class/CardifySettingTabClass";
import CardifySettings from "./interface/ICardifySettings";
import { copyTextToClipboard } from "./utils/clipboardUtils";

const DEFAULT_SETTINGS: CardifySettings = {
	canvasCardDelimiter: '---',
}
export default class Cardify extends Plugin {
	settings: CardifySettings;

	addCopySortedCardsContentCommand(menu: any, canvas: any) {
		const selection = canvas.selection;
		if (!selection?.size || selection.size <= 1) {
			return;
		}

		menu.addItem((item: any) => {
			item
				.setTitle("复制已排序的卡片内容")
				.setIcon("copy-plus")
				.setSection("action")
				.onClick(async () => {
					const selectedNodes: any[] = Array.from(selection.values());
					const cardData = selectedNodes
						.filter(node => node.getData().type === 'text' && node.getData().text)
						.map(node => ({
							text: node.getData().text,
							x: node.x,
							y: node.y
						}));

					// 从上到下，从左到右排序
					cardData.sort((a, b) => {
						if (a.y !== b.y) {
							return a.y - b.y;
						}
						return a.x - b.x;
					});

					const combinedText = cardData.map(card => card.text).join('\n\n');

					if (combinedText) {
						await copyTextToClipboard(combinedText, `已复制 ${cardData.length} 张卡片的内容`);
					}
				});
		});
	}

	addCopyCardContentCommand(menu: any, node: any) {
		const nodeData = node.getData();
		if (node.isEditing || nodeData.type !== 'text' || !nodeData.text) {
			return;
		}
		menu.addItem((item: any) => {
			item
				.setTitle("复制卡片文本")
				.setIcon("copy")
				.setSection("action")
				.onClick(async () => {
					await copyTextToClipboard(nodeData.text);
				});
		});
	}

	addSplitCardCommand(menu: any, node: any) {
		const nodeData = node.getData();
		if (node.isEditing || nodeData.type !== 'text' || !nodeData.text) {
			return;
		}
		menu.addItem((item: any) => {
			item
				.setTitle("按分隔符拆分卡片")
				.setIcon("split")
				.setSection("action")
				.onClick(async () => {
					const canvas = node.canvas;
					const sections = nodeData.text.split(this.settings.canvasCardDelimiter);
					if (sections.length <= 1) {
						new Notice("卡片内容不包含分隔符，无法拆分。");
						return;
					}

					const PADDING = 20;
					const FIXED_CARD_HEIGHT = 60;

					const x = node.x + node.width + PADDING;
					let y = node.y;

					for (const section of sections) {
						const trimmedSection = section.trim();
						if (trimmedSection === '') continue;

						const newCardWidth = node.width;

						const newNode = canvas.createTextNode({
							pos: {
								x: x,
								y: y
							},
							text: trimmedSection,
							focus: false,
						});

						newNode.resize({width: newCardWidth, height: FIXED_CARD_HEIGHT});

						canvas.addNode(newNode);
						y += FIXED_CARD_HEIGHT + PADDING;
					}
					canvas.requestSave(true, true);
				});
		});
	}

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CardifySettingTab(this.app, this));

		// @ts-ignore
		this.registerEvent(this.app.workspace.on('canvas:node-menu', (menu: any, node: any) => {
			const canvas = node.canvas;
			const selection = canvas.selection;

			if (selection?.size > 1) {
				this.addCopySortedCardsContentCommand(menu, canvas);
			} else {
				this.addCopyCardContentCommand(menu, node);
			}
			this.addSplitCardCommand(menu, node);
		}));

		// @ts-ignore
		this.registerEvent(this.app.workspace.on('canvas:selection-menu', (menu: any, canvas: any) => {
			const selection = canvas.selection;
			if (selection?.size > 1) {
				this.addCopySortedCardsContentCommand(menu, canvas);
			} else if (selection?.size === 1) {
				const node = Array.from(selection.values())[0];
				this.addCopyCardContentCommand(menu, node);
				this.addSplitCardCommand(menu, node);
			}
		}));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}