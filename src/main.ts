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
		// 我们需要在多个元素上设置属性，以确保兼容性
		const elementsToUpdate = [
			this.node.nodeEl?.querySelector('.canvas-node-content'),
			this.node.nodeEl?.querySelector('.canvas-node-container'),
			this.node.nodeEl
		].filter(Boolean);
		
		if (elementsToUpdate.length === 0) {
			console.error("无法找到合适的元素来设置徽章");
			new Notice("设置徽章失败：无法找到卡片元素");
			return;
		}
		
		try {
			elementsToUpdate.forEach(element => {
				if (badgeText) {
					// 设置徽章属性
					element.setAttribute("data-badge", badgeText);
					
					// 判断徽章类型
					if (/^\d+$/.test(badgeText)) {
						element.setAttribute("data-badge-type", "number");
					} else if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(badgeText)) {
						element.setAttribute("data-badge-type", "emoji");
					} else {
						element.setAttribute("data-badge-type", "text");
					}
				} else {
					// 移除徽章
					element.removeAttribute("data-badge");
					element.removeAttribute("data-badge-type");
				}
			});
			
			// 通知用户
			if (badgeText) {
				new Notice(`徽章已设置为: ${badgeText}`);
			} else {
				new Notice("徽章已移除");
			}
			
			// 重新注入样式以确保生效
			this.plugin.reinjectStyles();
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
	private styleEl: HTMLStyleElement | null = null;

	// 确保样式存在
	ensureStylesExist() {
		if (!document.querySelector('#canvas-badge-styles')) {
			this.injectStyles();
		}
	}

	// 重新注入样式
	reinjectStyles() {
		// 移除旧样式
		if (this.styleEl && this.styleEl.parentNode) {
			this.styleEl.remove();
		}
		// 重新注入
		this.injectStyles();
	}

	// 注入徽章样式
	injectStyles() {
		// 创建样式元素
		this.styleEl = document.createElement("style");
		this.styleEl.id = "canvas-badge-styles";
		
		// 使用高特异性的选择器和 !important 来确保样式生效
		this.styleEl.textContent = `
			/* 确保 Canvas 节点内容有相对定位 */
			.canvas-node .canvas-node-content {
				position: relative !important;
			}
			
			/* 主要徽章样式 - 使用多个选择器以确保兼容性 */
			.canvas-node .canvas-node-content[data-badge]::after,
			.canvas-node-content[data-badge]::after,
			.markdown-embed[data-badge]::after,
			[data-badge].canvas-node-content::after {
				content: attr(data-badge) !important;
				position: absolute !important;
				top: -10px !important;
				right: -10px !important;
				min-width: 22px !important;
				height: 22px !important;
				padding: 3px 7px !important;
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				font-size: 12px !important;
				font-weight: bold !important;
				color: white !important;
				background-color: #5865F2 !important;
				border-radius: 11px !important;
				z-index: 1000 !important;
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
				white-space: nowrap !important;
				pointer-events: none !important;
				line-height: 1 !important;
				font-family: var(--font-interface) !important;
				opacity: 1 !important;
				visibility: visible !important;
				border: 2px solid var(--background-primary) !important;
			}
			
			/* 数字徽章样式 - 完美的圆形 */
			.canvas-node-content[data-badge-type="number"]::after,
			[data-badge-type="number"].canvas-node-content::after {
				background-color: #5865F2 !important;
				border-radius: 50% !important;
				min-width: 24px !important;
				height: 24px !important;
				padding: 0 !important;
			}
			
			/* 文字徽章样式 - 药丸形状 */
			.canvas-node-content[data-badge-type="text"]::after,
			[data-badge-type="text"].canvas-node-content::after {
				background-color: #6c757d !important;
				border-radius: 12px !important;
				padding: 3px 10px !important;
				min-width: auto !important;
			}
			
			/* Emoji 徽章样式 - 更大，无背景 */
			.canvas-node-content[data-badge-type="emoji"]::after,
			[data-badge-type="emoji"].canvas-node-content::after {
				background-color: transparent !important;
				box-shadow: none !important;
				border: none !important;
				font-size: 20px !important;
				min-width: auto !important;
				height: auto !important;
				padding: 0 !important;
				top: -12px !important;
				right: -12px !important;
			}
			
			/* 选中状态下的徽章 */
			.canvas-node.is-selected .canvas-node-content[data-badge]::after {
				z-index: 1001 !important;
			}
			
			/* 暗色主题优化 */
			.theme-dark .canvas-node-content[data-badge]::after {
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
			}
			
			/* 徽章出现动画 */
			@keyframes badge-appear {
				from {
					transform: scale(0);
					opacity: 0;
				}
				to {
					transform: scale(1);
					opacity: 1;
				}
			}
			
			.canvas-node-content[data-badge]::after {
				animation: badge-appear 0.2s ease-out !important;
			}
			
			/* 确保在缩放时徽章保持可见 */
			.canvas-node-content[data-badge] {
				overflow: visible !important;
			}
			
			/* 备用方案：对容器元素也应用徽章 */
			.canvas-node-container[data-badge]::after {
				content: attr(data-badge) !important;
				position: absolute !important;
				top: -10px !important;
				right: -10px !important;
				min-width: 22px !important;
				height: 22px !important;
				padding: 3px 7px !important;
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				font-size: 12px !important;
				font-weight: bold !important;
				color: white !important;
				background-color: #ff5722 !important;
				border-radius: 11px !important;
				z-index: 999 !important;
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
				white-space: nowrap !important;
				pointer-events: none !important;
				border: 2px solid var(--background-primary) !important;
			}
			
			/* 防止容器的徽章与内容的徽章重叠 */
			.canvas-node-container[data-badge] .canvas-node-content[data-badge]::after {
				display: flex !important; /* 优先显示内容上的徽章 */
			}
			
			.canvas-node-container[data-badge]::after {
				display: none !important; /* 如果内容有徽章，隐藏容器的徽章 */
			}
			
			.canvas-node-container[data-badge]:not(:has(.canvas-node-content[data-badge]))::after {
				display: flex !important; /* 只有内容没有徽章时，才显示容器的徽章 */
			}
		`;
		
		// 将样式添加到文档头部
		document.head.appendChild(this.styleEl);
		
		console.log("Canvas badge styles injected successfully");
	}

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
		// 从多个可能的位置尝试获取徽章
		const possibleElements = [
			node.nodeEl?.querySelector('.canvas-node-content'),
			node.nodeEl?.querySelector('.canvas-node-container'),
			node.nodeEl
		].filter(Boolean);
		
		for (const element of possibleElements) {
			const badge = element.getAttribute("data-badge");
			if (badge) {
				return badge;
			}
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

		// 初始加载样式
		this.injectStyles();

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

		// 监听布局变化，确保样式始终存在
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.ensureStylesExist();
			})
		);

		// 监听文件打开事件
		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				setTimeout(() => {
					this.ensureStylesExist();
				}, 100);
			})
		);

		// 初始化已打开的 Canvas 视图中的徽章显示
		this.app.workspace.onLayoutReady(() => {
			this.initializeAllCanvasBadges();
			this.ensureStylesExist();
		});
	}

	// 初始化所有 Canvas 视图中的徽章显示
	initializeAllCanvasBadges() {
		// 确保样式已加载
		this.ensureStylesExist();
		
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
			const elementsToUpdate = [
				node.nodeEl?.querySelector('.canvas-node-content'),
				node.nodeEl?.querySelector('.canvas-node-container'),
				node.nodeEl
			].filter(Boolean);
			
			elementsToUpdate.forEach(element => {
				element.removeAttribute("data-badge");
				element.removeAttribute("data-badge-type");
			});
			return;
		}
		
		// 确保样式存在
		this.ensureStylesExist();
	}

	onunload() {
		// 清理样式
		if (this.styleEl && this.styleEl.parentNode) {
			this.styleEl.remove();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}