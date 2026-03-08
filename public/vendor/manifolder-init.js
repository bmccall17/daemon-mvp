// Wrapper: import ManifolderClient ESM and expose factory on window
import { createManifolderPromiseClient } from './ManifolderClient.js';
window.__createManifolderPromiseClient = createManifolderPromiseClient;
window.__manifolderReady = true;
