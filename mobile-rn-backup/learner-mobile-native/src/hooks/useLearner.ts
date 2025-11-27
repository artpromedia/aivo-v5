import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {Learner} from '../types';

export const useLearner = () => {
  const {user} = useAuth();
  const [currentLearner, setCurrentLearner] = useState<Learner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLearner();
  }, [user]);

  const loadLearner = async () => {
    if (!user) {
      setCurrentLearner(null);
      setIsLoading(false);
      return;
    }

    try {
      // For now, create a mock learner from user
      // In production, fetch from API
      const learner: Learner = {
        id: user.id,
        user_id: user.id,
        virtual_brain_enabled: true,
      };
      setCurrentLearner(learner);
    } catch (error) {
      console.error('Failed to load learner:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentLearner,
    isLoading,
  };
};
