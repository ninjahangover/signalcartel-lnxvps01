// Client-side safe version of Markov model persistence

export class MarkovModelPersistence {
  static async initialize(): Promise<void> {
    console.log('⚠️ Markov persistence unavailable in browser');
  }

  static async saveModel(): Promise<void> {
    console.log('⚠️ Model save unavailable in browser');
  }

  static async loadModel(): Promise<void> {
    console.log('⚠️ Model load unavailable in browser');
  }

  static startAutoSave(): void {
    console.log('⚠️ Auto-save unavailable in browser');
  }

  static stopAutoSave(): void {
    console.log('⚠️ Auto-save stop unavailable in browser');
  }

  static getStatus() {
    return {
      autoSaveEnabled: false,
      lastSaveTime: null,
      modelExists: false
    };
  }

  static async createSnapshot(): Promise<string> {
    throw new Error('Snapshots unavailable in browser');
  }

  static async loadSnapshot(): Promise<void> {
    throw new Error('Snapshots unavailable in browser');
  }

  static async listSnapshots(): Promise<string[]> {
    return [];
  }
}

// Export dummy functions for client-side
export const initializeMarkovPersistence = () => MarkovModelPersistence.initialize();
export const saveMarkovModel = () => MarkovModelPersistence.saveModel();
export const loadMarkovModel = () => MarkovModelPersistence.loadModel();
export const createMarkovSnapshot = () => MarkovModelPersistence.createSnapshot();