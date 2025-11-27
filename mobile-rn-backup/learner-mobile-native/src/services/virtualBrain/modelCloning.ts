import {MMKV} from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';
import aivoApi from '../api/aivoApi';

interface CloneOptions {
  sourceLearner: string;
  targetLearner: string;
  cloneType: 'full' | 'partial' | 'sibling';
  preserveSettings?: string[];
  excludeData?: string[];
}

interface ModelSnapshot {
  learnerId?: string;
  virtualBrainId?: string;
  profile: any;
  cognitiveState: any;
  performanceMetrics: any;
  adaptationHistory: any[];
  memoryBank: any[];
  skillMastery: Record<string, number>;
  preferences: any;
  timestamp: string;
}

class ModelCloningService {
  private storage = new MMKV({id: 'model-cloning'});

  async cloneModel(options: CloneOptions): Promise<boolean> {
    try {
      console.log(`Starting model clone from ${options.sourceLearner} to ${options.targetLearner}`);

      const snapshot = await this.createModelSnapshot(options.sourceLearner);
      const cloneData = await this.prepareCloneData(snapshot, options);
      const result = await this.applyClone(options.targetLearner, cloneData, options.cloneType);

      if (result.success) {
        await this.saveCloneHistory(options, result);
        return true;
      }

      throw new Error('Clone verification failed');
    } catch (error) {
      console.error('Model cloning failed:', error);
      throw error;
    }
  }

  async createModelSnapshot(learnerId: string): Promise<ModelSnapshot> {
    const [brainState, progress, memory, adaptations] = await Promise.all([
      aivoApi.getVirtualBrainState(learnerId),
      aivoApi.getLearnerProgress(learnerId),
      aivoApi.getMemoryBank(learnerId),
      aivoApi.getAdaptationHistory(learnerId),
    ]);

    const snapshot: ModelSnapshot = {
      learnerId,
      virtualBrainId: brainState.brain_id,
      profile: brainState.profile,
      cognitiveState: brainState.cognitive_state,
      performanceMetrics: brainState.performance_metrics,
      adaptationHistory: adaptations.history,
      memoryBank: memory.memories,
      skillMastery: progress.skill_mastery,
      preferences: brainState.preferences,
      timestamp: new Date().toISOString(),
    };

    await this.cacheSnapshot(snapshot);
    return snapshot;
  }

  async prepareCloneData(snapshot: ModelSnapshot, options: CloneOptions): Promise<any> {
    let cloneData = {...snapshot};

    delete cloneData.learnerId;
    delete cloneData.virtualBrainId;

    switch (options.cloneType) {
      case 'full':
        cloneData = this.sanitizePersonalData(cloneData);
        break;
      case 'partial':
        cloneData = this.filterPartialClone(cloneData, options.preserveSettings || []);
        break;
      case 'sibling':
        cloneData = await this.prepareSiblingClone(cloneData);
        break;
    }

    if (options.excludeData) {
      cloneData = this.excludeData(cloneData, options.excludeData);
    }

    cloneData.cognitiveState = this.resetCognitiveState(cloneData.cognitiveState);
    cloneData.performanceMetrics = this.adjustPerformanceMetrics(cloneData.performanceMetrics);

    return cloneData;
  }

  async applyClone(targetLearnerId: string, cloneData: any, cloneType: string): Promise<any> {
    const result = await aivoApi.applyModelClone(targetLearnerId, {
      clone_data: cloneData,
      clone_type: cloneType,
      validation_required: true,
    });

    await this.initializeLocalState(targetLearnerId, cloneData);
    return result;
  }

  private sanitizePersonalData(data: any): any {
    const sanitized = {...data};

    if (sanitized.memoryBank) {
      sanitized.memoryBank = sanitized.memoryBank.filter(
        (memory: any) => !memory.personal
      );
    }

    if (sanitized.preferences) {
      delete sanitized.preferences.avatar;
      delete sanitized.preferences.nickname;
    }

    return sanitized;
  }

  private filterPartialClone(data: any, preserveSettings: string[]): any {
    const filtered: any = {};

    preserveSettings.forEach(setting => {
      if (data[setting]) {
        filtered[setting] = data[setting];
      }
    });

    filtered.profile = {
      learning_style: data.profile?.learning_style,
      diagnoses: data.profile?.diagnoses,
    };

    return filtered;
  }

  private async prepareSiblingClone(data: any): Promise<any> {
    const siblingData = {...data};

    siblingData.family_patterns = {
      learning_preferences: data.profile?.learning_style,
      common_interests: data.profile?.interests,
      shared_challenges: data.profile?.challenges,
    };

    siblingData.age_adjusted = true;

    siblingData.adaptationHistory = data.adaptationHistory?.filter(
      (adaptation: any) => adaptation.effectiveness_score > 0.7
    );

    return siblingData;
  }

  private excludeData(data: any, excludeList: string[]): any {
    const filtered = {...data};
    excludeList.forEach(key => {
      delete filtered[key];
    });
    return filtered;
  }

  private resetCognitiveState(state: any): any {
    return {
      ...state,
      cognitive_load: 0.5,
      engagement: 1.0,
      frustration: 0.0,
      fatigue: 0.0,
      confidence: 0.7,
      motivation: 0.8,
      attention_span: 1.0,
      needs_break: false,
      last_break: new Date().toISOString(),
      session_start: new Date().toISOString(),
      activities_completed: 0,
    };
  }

  private adjustPerformanceMetrics(metrics: any): any {
    return {
      ...metrics,
      accuracy: metrics.accuracy * 0.9,
      speed: 1.0,
      consistency: 1.0,
      improvement_rate: 0.0,
      mastery_levels: Object.fromEntries(
        Object.entries(metrics.mastery_levels || {}).map(
          ([skill, level]: [string, any]) => [skill, level * 0.85]
        )
      ),
    };
  }

  private async initializeLocalState(learnerId: string, cloneData: any): Promise<void> {
    this.storage.set(`clone_${learnerId}`, JSON.stringify({
      data: cloneData,
      timestamp: new Date().toISOString(),
    }));

    await AsyncStorage.setItem(
      `@learner_clone_${learnerId}`,
      JSON.stringify(cloneData)
    );
  }

  private async cacheSnapshot(snapshot: ModelSnapshot): Promise<void> {
    if (!snapshot.learnerId) {
      throw new Error('Cannot cache snapshot without learnerId');
    }
    const key = `snapshot_${snapshot.learnerId}_${Date.now()}`;
    this.storage.set(key, JSON.stringify(snapshot));
    this.cleanupOldSnapshots(snapshot.learnerId);
  }

  private cleanupOldSnapshots(learnerId: string): void {
    const keys = this.storage.getAllKeys();
    const learnerSnapshots = keys
      .filter(key => key.startsWith(`snapshot_${learnerId}_`))
      .sort()
      .reverse();

    if (learnerSnapshots.length > 5) {
      learnerSnapshots.slice(5).forEach(key => {
        this.storage.delete(key);
      });
    }
  }

  private async saveCloneHistory(options: CloneOptions, result: any): Promise<void> {
    const history = {
      id: `clone_${Date.now()}`,
      source: options.sourceLearner,
      target: options.targetLearner,
      type: options.cloneType,
      timestamp: new Date().toISOString(),
      success: result.success,
      details: result.details,
    };

    const existingHistory = this.storage.getString('clone_history');
    const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
    historyArray.push(history);

    if (historyArray.length > 50) {
      historyArray.shift();
    }

    this.storage.set('clone_history', JSON.stringify(historyArray));
    await aivoApi.logCloneHistory(options.targetLearner, history);
  }

  async getCloneRecommendations(learnerId: string): Promise<any[]> {
    try {
      const profile = await aivoApi.getLearnerProfile(learnerId);

      const recommendations = await aivoApi.findSimilarProfiles(learnerId);

      return recommendations.map((rec: any) => ({
        sourceLearnerId: rec.learner_id,
        sourceName: rec.name,
        similarity: rec.similarity_score,
        matchedCriteria: rec.matched_criteria,
        benefits: rec.expected_benefits,
        recommended: rec.similarity_score > 0.8,
      }));
    } catch (error) {
      console.error('Failed to get clone recommendations:', error);
      return [];
    }
  }
}

export default new ModelCloningService();
