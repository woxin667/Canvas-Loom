import {Notice, Plugin, Modal, Setting} from 'obsidian';
import CardifySettingTab from "./class/CardifySettingTabClass";
import CardifySettings from "./interface/ICardifySettings";
import { copyTextToClipboard } from "./utils/clipboardUtils";

// 徽章输入模态框
class BadgeModal extends Modal {
	private node: any;
	private plugin: Cardify;
	private badgeInput: HTMLInputElement;
	private currentBadge: string;

	constructor(plugin: Cardify, node: any, currentBadge: string) {
		super(plugin.app);
		this.plugin = plugin;
		this.node = node;
		this.currentBadge = currentBadge;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: this.currentBadge ? "编辑徽章" : "添加徽章"});

		new Setting(contentEl)
			.setName("徽章内容")
			.setDesc("输入要显示在卡片上的徽章内容（数字、文字或emoji）")
			.addText(text => {
				text.setPlaceholder("例如: 1, Done, ✅")
					.setValue(this.currentBadge || "")
					.onChange(value => {
						this.currentBadge = value;
					});
				this.badgeInput = text.inputEl;
			});

		new Setting(contentEl)
			.addButton(button => button
				.setButtonText("确定")
				.setCta()
				.onClick(() => {
					this.setBadge(this.currentBadge);
					this.close();
				}))
			.addButton(button => button
				.setButtonText("移除徽章")
				.onClick(() => {
					this.setBadge("");
					this.close();
				}))
			.addButton(button => button
				.setButtonText("取消")
				.onClick(() => {
					this.close();
				}));

		// 聚焦到输入框
		this.badgeInput.focus();
	}

	async setBadge(badgeText: string) {
		// 直接在卡片上设置徽章，不依赖文件
		try {
			// 更新节点元素的 data-badge 属性
			if (this.node.nodeEl) {
				if (badgeText) {
					this.node.nodeEl.setAttribute("data-badge", badgeText);
					
					// 设置徽章类型
					if (/^\d+$/.test(badgeText)) {
						this.node.nodeEl.setAttribute("data-badge-type", "number");
					} else if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(badgeText)) {
						this.node.nodeEl.setAttribute("data-badge-type", "emoji");
					} else {
						this.node.nodeEl.setAttribute("data-badge-type", "text");
					}
				} else {
					this.node.nodeEl.removeAttribute("data-badge");
					this.node.nodeEl.removeAttribute("data-badge-type");
				}
				
				// 通知用户
				if (badgeText) {
					new Notice(`徽章已设置为: ${badgeText}`);
				} else {
					new Notice("徽章已移除");
				}
			} else {
				new Notice("无法访问卡片元素");
			}
		} catch (error) {
			console.error("设置徽章时出错:", error);
			new Notice("设置徽章时出错，请查看控制台了解详情");
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

const DEFAULT_SETTINGS: CardifySettings = {
	canvasCardDelimiter: '---',
	sortPriority: 'yx', // 默认优先按y坐标排序
	enableBadges: true, // 默认启用徽章功能
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

					// 根据设置的优先级进行排序
					cardData.sort((a, b) => {
						if (this.settings.sortPriority === 'yx') {
							// 优先按y坐标排序（从上到下，然后从左到右）
							if (a.y !== b.y) {
								return a.y - b.y;
							}
							return a.x - b.x;
						} else {
							// 优先按x坐标排序（从左到右，然后从上到下）
							if (a.x !== b.x) {
								return a.x - b.x;
							}
							return a.y - b.y;
						}
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


	// 获取卡片当前的徽章内容
	async getCurrentBadge(node: any): Promise<string> {
		// 从卡片元素的属性中获取徽章信息
		if (node.nodeEl) {
			return node.nodeEl.getAttribute("data-badge") || "";
		}
		return "";
	}

	// 添加徽章命令到右键菜单
	addBadgeCommand(menu: any, node: any) {
		// 检查是否启用了徽章功能
		if (!this.settings.enableBadges) {
			return;
		}
		
		const nodeData = node.getData();
		if (nodeData.type !== 'text') {
			return;
		}

		menu.addItem((item: any) => {
			item
				.setTitle("添加/编辑徽章")
				.setIcon("tag")
				.setSection("action")
				.onClick(async () => {
					const currentBadge = await this.getCurrentBadge(node);
					new BadgeModal(this, node, currentBadge).open();
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
			this.addBadgeCommand(menu, node);
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
				this.addBadgeCommand(menu, node);
			}
		}));

		// 监听文件变化，更新 Canvas 节点的徽章显示
		this.registerEvent(this.app.metadataCache.on("changed", (file) => {
			// 获取所有打开的 Canvas 视图
			this.app.workspace.iterateAllLeaves((leaf) => {
				// @ts-ignore
				if (leaf.view?.constructor?.name === "CanvasView") {
					// @ts-ignore
					const canvas = leaf.view.canvas;
					// 遍历所有节点
					for (const node of canvas.nodes.values()) {
						if (node.file === file) {
							// 更新节点的徽章显示
							this.updateNodeBadgeDisplay(node);
						}
					}
				}
			});
		}));

		// 初始化已打开的 Canvas 视图中的徽章显示
		this.app.workspace.onLayoutReady(() => {
			this.initializeAllCanvasBadges();
		});
	}

	// 初始化所有 Canvas 视图中的徽章显示
	initializeAllCanvasBadges() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			// @ts-ignore
			if (leaf.view?.constructor?.name === "CanvasView") {
				// @ts-ignore
				const canvas = leaf.view.canvas;
				// 遍历所有节点
				for (const node of canvas.nodes.values()) {
					// 更新节点的徽章显示
					this.updateNodeBadgeDisplay(node);
				}
			}
		});
	}

	// 更新节点的徽章显示
	updateNodeBadgeDisplay(node: any) {
		// 检查是否启用了徽章功能
		if (!this.settings.enableBadges) {
			// 如果未启用，确保移除所有徽章显示
			if (node.nodeEl) {
				node.nodeEl.removeAttribute("data-badge");
				node.nodeEl.removeAttribute("data-badge-type");
			}
			return;
		}
		
		// 直接从卡片元素的属性中获取徽章信息
		if (node.nodeEl) {
			// 徽章信息已经存储在 data-badge 属性中，无需额外处理
			// 这里可以添加任何需要的更新逻辑
			return;
		}
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}