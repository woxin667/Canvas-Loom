import {App, PluginSettingTab, Setting} from "obsidian";
import Cardify from "../main";

export default class CardifySettingTab extends PluginSettingTab {
	plugin: Cardify;

	constructor(app: App, plugin: Cardify) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('设置Canvas卡片分隔符')
			.setDesc('输入用于拆分单个Canvas卡片的分隔符')
			.addText(text => text
				.setPlaceholder('---')
				.setValue(this.plugin.settings.canvasCardDelimiter)
				.onChange(async (value) => {
					this.plugin.settings.canvasCardDelimiter = value;
					await this.plugin.saveSettings();
				}));
	}
}
