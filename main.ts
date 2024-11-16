import { Plugin, Modal, TFile, App, PluginSettingTab, Setting } from 'obsidian';

interface ObsifetchSettings {
    customLogo: string;
}

const DEFAULT_SETTINGS: ObsifetchSettings = {
    customLogo: ''
}

class ObsifetchModal extends Modal {
    private logo: string;
    private vaultInfo: string;
    private systemInfo: string;

    constructor(app: App, logo: string, vaultInfo: string, systemInfo: string) {
        super(app);
        this.logo = logo;
        this.vaultInfo = vaultInfo;
        this.systemInfo = systemInfo;
    }

    onOpen() {
      const {contentEl} = this;
      contentEl.addClass('obsifetch-modal');
      contentEl.createEl('div', {
          text: '> obsifetch',
          cls: 'obsifetch-title'
      });
      const container = contentEl.createDiv({cls: 'obsifetch-container'});
  
      const logoSection = container.createDiv({cls: 'logo-section'});
      logoSection.createEl('pre', {text: this.logo});
  
      const infoSection = container.createDiv({cls: 'info-section'});
      const vaultName = this.app.vault.getName();
      
      infoSection.createEl('div', {
          text: `${require("os").userInfo().username}@${vaultName.toLowerCase()}`,
          cls: 'vault-header'
      });
  
      infoSection.createEl('hr', {
          cls: 'vault-separator'
      });
  
      const preElement = infoSection.createEl('pre');
      this.vaultInfo.toLowerCase().split('\n').forEach(line => {
        const [label, value] = line.split(': ');
        const lineDiv = preElement.createDiv();
        lineDiv.createSpan({text: label + ': ', cls: 'stat-label'});
        lineDiv.createSpan({text: value, cls: 'stat-value'});
    });
    this.systemInfo.toLowerCase().split('\n').forEach(line => {
        const [label, value] = line.split(': ');
        const lineDiv = preElement.createDiv();
        lineDiv.createSpan({text: label + ': ', cls: 'stat-label'});
        lineDiv.createSpan({text: value, cls: 'stat-value'});
    });
  
      const colorSquares = preElement.createSpan({cls: 'color-squares'});
      const currentRow = colorSquares.createSpan({cls: 'color-row'});
      [
          
          '--interactive-accent',
          '--text-accent',
          '--text-faint',
          '--text-normal',
          '--text-muted',
          '--text-error',
          '--text-highlight-bg',
          '--background-secondary',
          '--background-primary'
      ].forEach(color => {
          const square = currentRow.createSpan();
          square.style.backgroundColor = `var(${color})`;
          square.style.width = '1.5em';
          square.style.height = '1.5em';
          square.style.display = 'inline-block';
          square.style.marginLeft = '0';
      });
  }
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class ObsifetchSettingTab extends PluginSettingTab {
    plugin: ObsifetchPlugin;

    constructor(app: App, plugin: ObsifetchPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Custom ASCII Logo')
            .setDesc('Paste your custom ASCII art here')
            .addTextArea(text => text
                .setPlaceholder('Paste ASCII art here...')
                .setValue(this.plugin.settings.customLogo)
                .onChange(async (value) => {
                    this.plugin.settings.customLogo = value;
                    await this.plugin.saveSettings();
                }));
    }
}

export default class ObsifetchPlugin extends Plugin {
    settings: ObsifetchSettings;
    private ribbonIcon: HTMLElement;
    private defaultLogo = `        ;++       
      ;;+++X;     
    :;;;;;XXXX    
    :::::XXXXXX   
   ::..::XXXXXX   
   $+   .Xxx+++   
  $$$X  .:++++++  
 X$$$$X$&&$X+;;;+ 
;XXXXX$&$$$$$$;;. 
  XXXX$$$$$XXXX   
    XX$$XXXXXXX   
         ;XXXX     `;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ObsifetchSettingTab(this.app, this));
        console.log('loading obsifetch');
        this.addCommand({
            id: 'show-obsifetch',
            name: 'Show Obsifetch',
            callback: () => this.displayObsifetch()
        });
    
        this.ribbonIcon = this.addRibbonIcon(
            'terminal-square',
            'obsifetch',
            (evt: MouseEvent) => {
                this.displayObsifetch();
            }
        );
    }

private async getVaultStats() {
        // Theme detection
        const activeTheme = (this.app as any).customCss?.theme || 'default';
        
        // Plugin detection with core vs community split
        const manifests = (this.app as any).plugins?.manifests || {};
        const communityPluginCount = Object.keys(manifests).length;
        // Fix for internal plugins access
        const corePluginCount = Object.keys((this.app as any).internalPlugins?.plugins || {}).length;
        
        // Get all files and ensure they're TFiles
        const allFiles = this.app.vault.getAllLoadedFiles()
            .filter((file): file is TFile => file instanceof TFile);
        
        // Split by type (now guaranteed to be TFiles)
        const markdownFiles = allFiles
            .filter(file => file.extension === 'md');
        
        const attachments = allFiles
            .filter(file => file.extension !== 'md');
            
        // Calculate orphaned files
        const resolvedLinks = this.app.metadataCache.resolvedLinks;
        const linkedFiles = new Set<string>();
        
        Object.values(resolvedLinks).forEach(links => {
            Object.keys(links).forEach(path => linkedFiles.add(path));
        });
        
        const orphanedFiles = markdownFiles.filter(file => 
            !linkedFiles.has(file.path)
        ).length;
        
        // Calculate sizes with proper type assertions
        const totalSize = await this.calculateTotalSize(allFiles);
        const attachmentSize = await this.calculateTotalSize(attachments);
        const markdownSize = await this.calculateTotalSize(markdownFiles);
        
        const attachmentPercentage = ((attachments.length / allFiles.length) * 100).toFixed(1);
        
        return {
            totalFiles: allFiles.length,
            totalMarkdown: markdownFiles.length,
            totalAttachments: attachments.length,
            orphanedFiles,
            attachmentPercentage: `${attachmentPercentage}%`,
            totalPlugins: communityPluginCount + corePluginCount,
            communityPlugins: communityPluginCount,
            corePlugins: corePluginCount,
            theme: activeTheme,
            version: this.manifest.version,
            totalSize: this.formatSize(totalSize),
            markdownSize: this.formatSize(markdownSize),
            attachmentSize: this.formatSize(attachmentSize)
        };
    }

    private async calculateTotalSize(files: TFile[]): Promise<number> {
        let total = 0;
        for (const file of files) {
            try {
                const stat = await this.app.vault.adapter.stat(file.path);
                if (stat) {
                    total += stat.size;
                }
            } catch (e) {
                console.warn(`Failed to get size for file: ${file.path}`);
            }
        }
        return total;
    }
    private formatSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    private getSystemInfo(): string {
        const isDarkTheme = document.body.classList.contains('theme-dark');
        let platform = 'unknown';
        let osDetails = '';
        
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('linux')) {
            platform = 'linux';
            if (userAgent.includes('ubuntu')) {
                osDetails = 'ubuntu';
            } else if (userAgent.includes('fedora')) {
                osDetails = 'fedora';
            } else if (userAgent.includes('arch')) {
                osDetails = 'arch';
            } else if (userAgent.includes('debian')) {
                osDetails = 'debian';
            } else {
                osDetails = 'linux';
            }
        } else if (userAgent.includes('mac')) {
            platform = 'macos';
        } else if (userAgent.includes('win')) {
            platform = 'windows';
        }

        return [
            `appearance: ${isDarkTheme ? 'dark' : 'light'}`,
            `os: ${osDetails || platform}`
        ].join('\n').trimEnd();
    }

    private async displayObsifetch() {
        const stats = await this.getVaultStats();
        const info = this.getSystemInfo();

        const logo = this.settings.customLogo || this.defaultLogo;
    
        const vaultInfoLines = [
            `obsifetch: v${this.manifest.version}`,
            `total files: ${stats.totalFiles} (${stats.totalSize})`,
            `markdown files: ${stats.totalMarkdown} (${stats.markdownSize})`,
            `attachments: ${stats.totalAttachments} (${stats.attachmentSize})`,
            `orphan files: ${stats.orphanedFiles}`,
            `core plugins: ${stats.corePlugins}`,
            `community plugins: ${stats.communityPlugins}`,
            `theme: ${stats.theme}`
        ].join('\n').trimEnd();
    
        new ObsifetchModal(
            this.app,
            logo, 
            vaultInfoLines,
            info
        ).open();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        console.log('unloading obsifetch');
        this.ribbonIcon.remove();
    }
}
