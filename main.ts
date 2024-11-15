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
  
      infoSection.createEl('div', {
          text: '-'.repeat(36),
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

    private async getVaultStats() {
        const activeTheme = this.app.customCss.theme || 'default';
        const pluginCount = Object.keys(this.app.plugins.manifests).length;
        
        const allFiles = this.app.vault.getAllLoadedFiles()
            .filter(file => file instanceof TFile);
    
        const markdownFiles = allFiles
            .filter(file => file.extension === 'md');
    
        const attachments = allFiles
            .filter(file => file.extension !== 'md');
    
        return {
            totalFiles: allFiles.length,
            totalMarkdown: markdownFiles.length,
            totalAttachments: attachments.length,
            totalPlugins: pluginCount,
            theme: activeTheme
        };
    }

private getSystemInfo(): string {
  const isDarkTheme = document.body.classList.contains('theme-dark');
  let platform = 'unknown';
  let osDetails = '';
  
  if (navigator.userAgentData?.platform) {
      platform = navigator.userAgentData.platform.toLowerCase();
      if (platform === 'linux') {
          if (navigator.userAgent.includes('Ubuntu')) {
              osDetails = 'ubuntu';
          } else if (navigator.userAgent.includes('Fedora')) {
              osDetails = 'fedora';
          } else if (navigator.userAgent.includes('Arch')) {
              osDetails = 'arch';
          } else if (navigator.userAgent.includes('Debian')) {
              osDetails = 'debian';
          } else {
              osDetails = 'linux';
          }
      }
  } else {
      if (navigator.userAgent.includes('Win')) {
          platform = 'windows';
      } else if (navigator.userAgent.includes('Mac')) {
          platform = 'macos';
      } else if (navigator.userAgent.includes('Linux')) {
          platform = 'linux';
      }
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
      `total files: ${stats.totalFiles}`,
      `markdown files: ${stats.totalMarkdown}`,
      `attachments: ${stats.totalAttachments}`,
      `plugins: ${stats.totalPlugins}`,
      `theme: ${stats.theme}`
  ].join('\n').trimEnd();

    new ObsifetchModal(
        this.app,
        logo, 
        vaultInfoLines,
        info
    ).open();
}

    settings: ObsifetchSettings;

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
    private ribbonIcon: HTMLElement;

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