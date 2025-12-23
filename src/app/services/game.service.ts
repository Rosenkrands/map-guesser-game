import { Injectable, signal, computed } from '@angular/core';
import { City, Difficulty } from '../models/city.model';
import { environment } from '../../environments/environment';
import citiesData from '../../assets/data/cities.dk.json';
import easyStyle from '../../assets/styles/easy.json';
import mediumStyle from '../../assets/styles/medium.json';
import hardStyle from '../../assets/styles/hard.json';
import extremeStyle from '../../assets/styles/extreme.json';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly cities: City[] = citiesData as City[];
  private readonly STORAGE_KEY = 'map-guesser-min-population';
  private readonly HIGH_SCORE_PREFIX = 'map-guesser-high-score';

  // Signals for reactive state
  currentCity = signal<City | null>(null);
  minPopulation = signal<number>(this.loadMinPopulation());
  difficulty = signal<Difficulty>('easy');
  streak = signal<number>(0);
  highScore = signal<number>(0);
  gameState = signal<'playing' | 'correct' | 'wrong' | 'completed'>('playing');
  lastGuess = signal<string>('');

  private usedCities: Set<string> = new Set();

  // Computed signal for style that updates when difficulty changes
  style = computed(() => {
    const styles = {
      easy: easyStyle,
      medium: mediumStyle,
      hard: hardStyle,
      extreme: extremeStyle,
    };
    const style = JSON.parse(JSON.stringify(styles[this.difficulty()]));

    // Inject API key into style
    const apiKey = environment.mapTilerKey;
    if (style.sources?.openmaptiles?.url) {
      style.sources.openmaptiles.url = style.sources.openmaptiles.url.replace(
        '{MAPTILER_KEY}',
        apiKey
      );
    }
    if (style.glyphs) {
      style.glyphs = style.glyphs.replace('{MAPTILER_KEY}', apiKey);
    }

    return style;
  });

  constructor() {
    this.loadHighScore();
    this.startNewRound();
  }

  private loadMinPopulation(): number {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? Number.parseInt(stored, 10) : 10000;
  }

  private saveMinPopulation(population: number): void {
    localStorage.setItem(this.STORAGE_KEY, population.toString());
  }

  private getHighScoreKey(): string {
    return `${
      this.HIGH_SCORE_PREFIX
    }-${this.difficulty()}-${this.minPopulation()}`;
  }

  private loadHighScore(): void {
    const stored = localStorage.getItem(this.getHighScoreKey());
    this.highScore.set(stored ? Number.parseInt(stored, 10) : 0);
  }

  private saveHighScore(score: number): void {
    localStorage.setItem(this.getHighScoreKey(), score.toString());
    this.highScore.set(score);
  }

  setMinPopulation(population: number): void {
    this.minPopulation.set(population);
    this.saveMinPopulation(population);
    this.loadHighScore();
    this.usedCities.clear();
    this.streak.set(0);
    this.startNewRound();
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty.set(difficulty);
    this.loadHighScore();
    this.usedCities.clear();
    this.streak.set(0);
  }

  startNewRound(): void {
    const eligibleCities = this.cities.filter(
      (city) =>
        city.population >= this.minPopulation() &&
        !this.usedCities.has(city.name)
    );

    if (eligibleCities.length === 0) {
      // Check if we completed all cities (have a streak going)
      if (this.streak() > 0) {
        this.gameState.set('completed');
        return;
      }
      // Otherwise just reset and start over
      this.usedCities.clear();
      const allEligibleCities = this.cities.filter(
        (city) => city.population >= this.minPopulation()
      );
      if (allEligibleCities.length === 0) {
        console.error('No cities match the current population threshold');
        return;
      }
      const randomIndex = Math.floor(Math.random() * allEligibleCities.length);
      this.currentCity.set(allEligibleCities[randomIndex]);
      this.gameState.set('playing');
      this.lastGuess.set('');
      return;
    }

    const randomIndex = Math.floor(Math.random() * eligibleCities.length);
    this.currentCity.set(eligibleCities[randomIndex]);
    this.gameState.set('playing');
    this.lastGuess.set('');
  }

  submitGuess(guess: string): boolean {
    const currentCityName = this.currentCity()?.name;
    if (!currentCityName) return false;

    const normalizedGuess = this.normalizeString(guess);
    const normalizedAnswer = this.normalizeString(currentCityName);

    const isCorrect = normalizedGuess === normalizedAnswer;

    if (isCorrect) {
      this.usedCities.add(currentCityName);
      this.streak.update((s) => s + 1);
      const newStreak = this.streak();
      if (newStreak > this.highScore()) {
        this.saveHighScore(newStreak);
      }
      this.gameState.set('correct');
    } else {
      this.streak.set(0);
      this.usedCities.clear();
      this.gameState.set('wrong');
    }

    this.lastGuess.set(guess);
    return isCorrect;
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '') // Remove diacritics
      .trim();
  }

  getCitiesCount(): number {
    return this.cities.filter((city) => city.population >= this.minPopulation())
      .length;
  }

  getAvailableCityNames(): string[] {
    return this.cities.map((city) => city.name).sort();
  }

  restartAfterCompletion(): void {
    this.usedCities.clear();
    this.streak.set(0);
    this.startNewRound();
  }
}
