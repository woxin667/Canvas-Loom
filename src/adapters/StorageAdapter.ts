import type { Plugin } from "obsidian";
import CanvasLoomSettings from "../settings/ICanvasLoomSettings";

type LegacyStorageData = Partial<CanvasLoomSettings> & {
    mergeDefaultOrder?: CanvasLoomSettings["defaultSortMode"];
};

export interface IStorageAdapter {
    loadSettings(): Promise<CanvasLoomSettings>;
    saveSettings(settings: CanvasLoomSettings): Promise<void>;
}

export class StorageAdapter implements IStorageAdapter {
    constructor(
        private plugin: Pick<Plugin, "loadData" | "saveData">,
        private defaultSettings: CanvasLoomSettings
    ) {}

    private normalizeLoadedSettings(data: unknown): LegacyStorageData {
        if (!data || typeof data !== "object") {
            return {};
        }

        return { ...(data as Record<string, unknown>) } as LegacyStorageData;
    }

    async loadSettings(): Promise<CanvasLoomSettings> {
        try {
            const data: unknown = await this.plugin.loadData();
            const normalizedData = this.normalizeLoadedSettings(data);

            if (!normalizedData.defaultSortMode && normalizedData.mergeDefaultOrder) {
                normalizedData.defaultSortMode = normalizedData.mergeDefaultOrder;
            }

            delete normalizedData.mergeDefaultOrder;
            return Object.assign({}, this.defaultSettings, normalizedData);
        } catch (error) {
            console.error("Failed to load settings:", error);
            return this.defaultSettings;
        }
    }

    async saveSettings(settings: CanvasLoomSettings): Promise<void> {
        try {
            await this.plugin.saveData({ ...settings });
        } catch (error) {
            console.error("Failed to save settings:", error);
            throw new Error("保存设置失败");
        }
    }
}
