import { MSFConfig, PeerState, SocialState, TopicId } from './types';
import { FormId } from './form-selector';

/**
 * MSF Bridge - connects daemon to the MSF spatial fabric via ManifolderClient.
 * Vendor MVMF scripts must be loaded in index.html before this runs.
 * Uses createManifolderPromiseClient() from the ManifolderClient ESM module.
 */
export class MSFBridge {
  private config: MSFConfig;
  private client: any = null;
  private scopeId: string | null = null;
  private sceneRootId: string | null = null;
  private playerObjectId: string | null = null;
  private connected = false;
  private lastPublishTime = 0;
  private isPublishing = false;

  constructor(config: MSFConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      // Dynamically load ManifolderClient ESM (vendor MVMF globals already loaded via index.html)
      if (!(window as any).__createManifolderPromiseClient) {
        const base = document.querySelector('base')?.href || window.location.href.replace(/[^/]*$/, '');
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.type = 'module';
          script.textContent = `
            import { createManifolderPromiseClient } from '${base}vendor/ManifolderClient.js';
            window.__createManifolderPromiseClient = createManifolderPromiseClient;
            window.dispatchEvent(new Event('manifolder-ready'));
          `;
          window.addEventListener('manifolder-ready', () => resolve(), { once: true });
          script.onerror = reject;
          document.head.appendChild(script);
          // Timeout fallback
          setTimeout(() => reject(new Error('ManifolderClient load timeout')), 5000);
        });
      }
      const factory = (window as any).__createManifolderPromiseClient;
      if (!factory) {
        console.error('[MSF Bridge] ManifolderClient failed to initialize.');
        return false;
      }
      this.client = factory();

      console.log('[MSF Bridge] Connecting to', this.config.fabricUrl);

      // Connect to fabric
      const result = await this.client.connectRoot({
        fabricUrl: this.config.fabricUrl,
        adminKey: this.config.adminKey,
        timeoutMs: 15000,
      });
      this.scopeId = result.scopeId;
      console.log('[MSF Bridge] Connected, scopeId:', this.scopeId);

      // List scenes, find or create daemon scene
      const scenes = await this.client.listScenes({ scopeId: this.scopeId });
      let scene = scenes.find((s: any) => s.name === this.config.sceneId);
      if (!scene) {
        scene = await this.client.createScene({
          scopeId: this.scopeId,
          name: this.config.sceneId,
        });
        console.log('[MSF Bridge] Created scene:', scene.name);
      }

      // Open the scene
      const opened = await this.client.openScene({
        scopeId: this.scopeId,
        sceneId: scene.id,
      });
      this.sceneRootId = opened.id;
      console.log('[MSF Bridge] Opened scene:', scene.name, 'root:', this.sceneRootId);

      this.connected = true;

      // Cleanup hook to delete player object on tab close
      window.addEventListener('beforeunload', () => this.disconnect());

      return true;
    } catch (err) {
      console.error('[MSF Bridge] Connection failed:', err);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async publishPlayer(state: {
    formId: FormId;
    socialState: SocialState;
    topics: TopicId[];
    position: { x: number; y: number; z: number };
    displayName: string;
  }): Promise<void> {
    if (!this.connected || !this.client || !this.scopeId || !this.sceneRootId) return;

    const now = Date.now();
    const positionInterval = 1000 / this.config.syncRates.positionHz;
    if (now - this.lastPublishTime < positionInterval) return;
    if (this.isPublishing) return;

    this.isPublishing = true;
    this.lastPublishTime = now;

    try {
      if (this.playerObjectId) {
        // Update existing object position
        await this.client.updateObject({
          scopeId: this.scopeId,
          objectId: this.playerObjectId,
          name: `daemon:${state.displayName}:${state.formId}:${state.socialState}:${now}:${JSON.stringify(state.topics)}`,
          position: state.position,
        });
      } else {
        // Create player object in scene
        const obj = await this.client.createObject({
          scopeId: this.scopeId,
          parentId: this.sceneRootId,
          name: `daemon:${state.displayName}:${state.formId}:${state.socialState}:${now}:${JSON.stringify(state.topics)}`,
          position: state.position,
        });
        this.playerObjectId = obj.id;
        console.log('[MSF Bridge] Created player object:', this.playerObjectId);
      }
    } catch (err) {
      console.error('[MSF Bridge] Publish failed:', err);
    } finally {
      this.isPublishing = false;
    }
  }

  async fetchPeers(): Promise<PeerState[]> {
    if (!this.connected || !this.client || !this.scopeId || !this.sceneRootId) return [];

    try {
      const objects = await this.client.listObjects({
        scopeId: this.scopeId,
        anchorObjectId: this.sceneRootId,
      });

      const peers: PeerState[] = [];

      for (const obj of objects) {
        // Skip scene root
        if (obj.id === this.sceneRootId) continue;
        // Skip our own object
        if (obj.id === this.playerObjectId) continue;
        // Only daemon objects (name starts with "daemon:")
        if (!obj.name?.startsWith('daemon:')) continue;

        // Parse state from name: "daemon:DisplayName:formId:socialState:timestamp:topicsJSON"
        const parts = obj.name.split(':');
        // Legacy check / old ghost objects
        if (parts.length < 6) continue;

        const displayName = parts[1];
        const formId = parts[2];
        const socialState = parts[3] as SocialState;
        const timestamp = parseInt(parts[4], 10);

        // Ignore ghost objects older than timeout (or invalid timestamps)
        const now = Date.now();
        if (isNaN(timestamp) || now - timestamp > 10000) continue;

        const topics = (() => {
          try { return JSON.parse(parts.slice(5).join(':')); } catch { return []; }
        })();

        const pos = obj.position || obj.transform?.position || { x: 0, y: 0, z: 0 };

        peers.push({
          id: obj.id,
          position: pos as any,
          socialState: socialState || SocialState.OPEN,
          topics,
          displayName: displayName || 'Unknown',
          formId,
          lastUpdate: timestamp,
        });
      }

      return peers;
    } catch (err) {
      console.error('[MSF Bridge] Fetch peers failed:', err);
      return [];
    }
  }

  disconnect(): void {
    if (this.client && this.connected && this.scopeId) {
      if (this.playerObjectId) {
        this.client.deleteObject({
          scopeId: this.scopeId,
          objectId: this.playerObjectId,
        }).catch(() => { });
      }
      this.client.closeScope({ scopeId: this.scopeId }).catch(() => { });
    }
    this.connected = false;
    this.client = null;
    this.scopeId = null;
    this.sceneRootId = null;
    this.playerObjectId = null;
    console.log('[MSF Bridge] Disconnected');
  }
}
