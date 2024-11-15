import { Plugin, Modal, TFile, App } from 'obsidian';

class NeofetchModal extends Modal {
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
      contentEl.addClass('neofetch-modal');
      contentEl.createEl('div', {
          text: '> obsifetch',
          cls: 'neofetch-title'
      });
      const container = contentEl.createDiv({cls: 'neofetch-container'});
  
      // Logo section
      const logoSection = container.createDiv({cls: 'logo-section'});
      logoSection.createEl('pre', {text: this.logo});
  
      // Combined info section
      const infoSection = container.createDiv({cls: 'info-section'});
      const vaultName = this.app.vault.getName();
      
      // Username@vault header
      infoSection.createEl('div', {
          text: `${require("os").userInfo().username}@${vaultName.toLowerCase()}`,
          cls: 'vault-header'
      });
  
      // Separator
      infoSection.createEl('div', {
          text: '-'.repeat(36),
          cls: 'vault-separator'
      });
  
      // Combined info content
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
  
      // Color squares
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

export default class ObsidianNeofetchPlugin extends Plugin {
    private async getVaultStats() {
        const activeTheme = this.app.customCss.theme || 'default';
        const pluginCount = Object.keys(this.app.plugins.manifests).length;
        
        // Get all real files (excluding folders)
        const allFiles = this.app.vault.getAllLoadedFiles()
            .filter(file => file instanceof TFile);
    
        // Filter markdown files
        const markdownFiles = allFiles
            .filter(file => file.extension === 'md');
    
        // Filter attachments
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
  
  // OS Detection
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

  // Return in desired order
  return [
    `appearance: ${isDarkTheme ? 'dark' : 'light'}`,
    `os: ${osDetails || platform}`
].join('\n').trimEnd();
}

  private async displayNeofetch() {
    const stats = await this.getVaultStats();
    const info = this.getSystemInfo();
    
    const logo = `        ;++       
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

    // Create vault info with proper line breaks
    const vaultInfoLines = [
      `total files: ${stats.totalFiles}`,
      `markdown files: ${stats.totalMarkdown}`,
      `attachments: ${stats.totalAttachments}`,
      `plugins: ${stats.totalPlugins}`,
      `theme: ${stats.theme}`
  ].join('\n').trimEnd(); // Join with newlines

    new NeofetchModal(
        this.app,
        logo, 
        vaultInfoLines,
        info
    ).open();
}

    async onload() {
        console.log('loading obsidian-neofetch');
        this.addCommand({
            id: 'show-neofetch',
            name: 'Show Neofetch Information',
            callback: () => this.displayNeofetch()
        });
    }

    onunload() {
        console.log('unloading obsidian-neofetch');
    }
}