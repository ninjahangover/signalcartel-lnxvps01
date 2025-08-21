// Server-side only Markov model persistence
import * as fs from 'fs/promises';
import * as path from 'path';

const MODEL_DIR = path.join(process.cwd(), 'data', 'models');
const MARKOV_MODEL_FILE = 'markov-chain-model.json';

export class MarkovModelPersistenceServer {
  private static autoSaveInterval: NodeJS.Timeout | null = null;
  private static lastSaveTime: Date | null = null;

  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(MODEL_DIR, { recursive: true });
      await this.loadModel();
      this.startAutoSave();
      console.log('✅ Markov model persistence initialized');
    } catch (error) {
      console.error('⚠️ Failed to initialize Markov model persistence:', error);
    }
  }

  static async saveModel(): Promise<void> {
    try {
      // Dynamically import to avoid browser issues
      const { markovPredictor } = await import('./markov-chain-predictor');
      
      const modelPath = path.join(MODEL_DIR, MARKOV_MODEL_FILE);
      const backupPath = path.join(MODEL_DIR, `${MARKOV_MODEL_FILE}.backup`);
      
      try {
        await fs.copyFile(modelPath, backupPath);
      } catch (error) {
        // No existing model to backup
      }
      
      const modelData = markovPredictor.exportModel();
      await fs.writeFile(modelPath, modelData, 'utf8');
      
      this.lastSaveTime = new Date();
      
      const llnMetrics = markovPredictor.getLLNConfidenceMetrics();
      console.log(`💾 Markov model saved | Convergence: ${llnMetrics.convergenceStatus} | Reliability: ${(llnMetrics.overallReliability * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Failed to save Markov model:', error);
      throw error;
    }
  }

  static async loadModel(): Promise<void> {
    try {
      const { markovPredictor } = await import('./markov-chain-predictor');
      
      const modelPath = path.join(MODEL_DIR, MARKOV_MODEL_FILE);
      
      await fs.access(modelPath);
      const modelData = await fs.readFile(modelPath, 'utf8');
      markovPredictor.importModel(modelData);
      
      const llnMetrics = markovPredictor.getLLNConfidenceMetrics();
      console.log(`📂 Markov model loaded | Convergence: ${llnMetrics.convergenceStatus} | Trades needed: ${llnMetrics.recommendedMinTrades}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📊 No existing Markov model found, starting fresh');
      } else {
        console.error('⚠️ Failed to load Markov model:', error);
      }
    }
  }

  static startAutoSave(intervalMinutes: number = 5): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(async () => {
      try {
        await this.saveModel();
      } catch (error) {
        console.error('⚠️ Auto-save failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
    
    console.log(`⏰ Markov model auto-save enabled (every ${intervalMinutes} minutes)`);
  }

  static stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏹️ Markov model auto-save stopped');
    }
  }

  static async createSnapshot(): Promise<string> {
    try {
      const { markovPredictor } = await import('./markov-chain-predictor');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const snapshotName = `markov-model-${timestamp}.json`;
      const snapshotPath = path.join(MODEL_DIR, 'snapshots', snapshotName);
      
      await fs.mkdir(path.join(MODEL_DIR, 'snapshots'), { recursive: true });
      
      const modelData = markovPredictor.exportModel();
      await fs.writeFile(snapshotPath, modelData, 'utf8');
      
      console.log(`📸 Markov model snapshot created: ${snapshotName}`);
      return snapshotName;
    } catch (error) {
      console.error('❌ Failed to create snapshot:', error);
      throw error;
    }
  }
}

// Export functions for server-side use only
export const initializeMarkovPersistence = () => MarkovModelPersistenceServer.initialize();
export const saveMarkovModel = () => MarkovModelPersistenceServer.saveModel();
export const loadMarkovModel = () => MarkovModelPersistenceServer.loadModel();
export const createMarkovSnapshot = () => MarkovModelPersistenceServer.createSnapshot();