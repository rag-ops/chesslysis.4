import type { ChessEngine, EngineAnalysisResult } from './engine';

export class MockChessEngine implements ChessEngine {
  constructor(private readonly result: EngineAnalysisResult = {
    depth: 18,
    evaluation: 0,
    mate: null,
    bestMove: null,
    principalVariation: [],
  }) {}

  async analyze(): Promise<EngineAnalysisResult> {
    return this.result;
  }
}
