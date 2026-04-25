import { useCallback } from 'react';
import { playCorrectSfx, playWrongSfx } from './rpgMusic';

export function useAnswerFeedback() {
  return useCallback((correct: boolean) => {
    if (correct) playCorrectSfx();
    else playWrongSfx();
  }, []);
}
