import { Component, output, input, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Difficulty } from '../../models/city.model';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  template: `
    <div class="controls">
      <div class="control-group">
        <label for="population">
          {{ 'CONTROLS.MIN_POPULATION' | translate }}: {{ minPopulation() }}
        </label>
        <input
          type="range"
          id="population"
          [value]="minPopulation()"
          min="5000"
          max="100000"
          step="5000"
          (input)="onPopulationChange($event)"
        />
        <small
          >{{ 'CONTROLS.CITIES_AVAILABLE' | translate }}:
          {{ citiesCount() }}</small
        >
      </div>

      <div class="control-group">
        <label for="difficulty">{{ 'CONTROLS.DIFFICULTY' | translate }}:</label>
        <select
          id="difficulty"
          [value]="difficulty"
          (change)="onDifficultyChange($event)"
        >
          <option value="easy">
            {{ 'CONTROLS.DIFFICULTY_EASY' | translate }}
          </option>
          <option value="medium">
            {{ 'CONTROLS.DIFFICULTY_MEDIUM' | translate }}
          </option>
          <option value="hard">
            {{ 'CONTROLS.DIFFICULTY_HARD' | translate }}
          </option>
          <option value="extreme">
            {{ 'CONTROLS.DIFFICULTY_EXTREME' | translate }}
          </option>
        </select>
      </div>
    </div>
  `,
  styles: [
    `
      .controls {
        background: #f5f5f5;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }

      .control-group {
        margin-bottom: 1rem;

        &:last-child {
          margin-bottom: 0;
        }
      }

      label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #333;
      }

      input[type='range'] {
        width: 100%;
        margin: 0.5rem 0;
      }

      select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        background: white;
      }

      small {
        display: block;
        color: #666;
        margin-top: 0.25rem;
      }
    `,
  ],
})
export class ControlsComponent {
  initialPopulation = input<number>(10000);
  citiesCountInput = input<number>(0);

  minPopulation = computed(() => this.initialPopulation());
  difficulty: Difficulty = 'easy';
  citiesCount = computed(() => this.citiesCountInput());

  populationChange = output<number>();
  difficultyChange = output<Difficulty>();

  onPopulationChange(event: Event): void {
    const value = Number.parseInt((event.target as HTMLInputElement).value);
    this.populationChange.emit(value);
  }

  onDifficultyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as Difficulty;
    this.difficulty = value;
    this.difficultyChange.emit(value);
  }
}
