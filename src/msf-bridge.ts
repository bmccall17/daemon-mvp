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

  constructor(config: MSFConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      // Import ManifolderClient ESM (vendor MVMF scripts already loaded via index.html)
      // Use document.baseURI to resolve relative to the page, not the bundled JS
      const base = document.baseURI.replace(/\/$/, '');
      const mod = await import(/* @vite-ignore */ `${base}/vendor/ManifolderClient.js`);
      this.client = mod.createManifolderPromiseClient();

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
    this.lastPublishTime = now;

    try {
      if (this.playerObjectId) {
        // Update existing object position
        await this.client.updateObject({
          scopeId: this.scopeId,
          objectId: this.playerObjectId,
          name: `daemon:${state.displayName}:${state.formId}:${state.socialState}:${JSON.stringify(state.topics)}`,
          position: state.position,
        });
      } else {
        // Create player object in scene
        const obj = await this.client.createObject({
          scopeId: this.scopeId,
          parentId: this.sceneRootId,
          name: `daemon:${state.displayName}:${state.formId}:${state.socialState}:${JSON.stringify(state.topics)}`,
          position: state.position,
        });
        this.playerObjectId = obj.id;
        console.log('[MSF Bridge] Created player object:', this.playerObjectId);
      }
    } catch (err) {
      console.error('[MSF Bridge] Publish failed:', err);
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

        // Parse state from name: "daemon:DisplayName:formId:socialState:topicsJSON"
        const parts = obj.name.split(':');
        if (parts.length < 5) continue;

        const displayName = parts[1];
        const formId = parts[2];
        const socialState = parts[3] as SocialState;
        const topics = (() => {
          try { return JSON.parse(parts.slice(4).join(':')); } catch { return []; }
        })();

        const pos = obj.position || obj.transform?.position || { x: 0, y: 0, z: 0 };

        peers.push({
          id: obj.id,
          position: pos as any,
          socialState: socialState || SocialState.OPEN,
          topics,
          displayName: displayName || 'Unknown',
          formId,
          lastUpdate: Date.now(),
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
        }).catch(() => {});
      }
      this.client.closeScope({ scopeId: this.scopeId }).catch(() => {});
    }
    this.connected = false;
    this.client = null;
    this.scopeId = null;
    this.sceneRootId = null;
    this.playerObjectId = null;
    console.log('[MSF Bridge] Disconnected');
  }
}
