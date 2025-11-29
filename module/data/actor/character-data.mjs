/**
 * Data Model for Character-type Actors
 * Extends TypeDataModel (Foundry v13)
 */
export default class CharacterData extends foundry.abstract.TypeDataModel {
  
  /**
   * Define the schema for character data
   */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      // Basic Info
      level: new fields.NumberField({
        required: true,
        initial: 1,
        integer: true,
        min: 1,
        max: 20
      }),
      
      experience: new fields.NumberField({
        required: true,
        initial: 0,
        integer: true,
        min: 0,
        max: 100
      }),

      // Biography
      biography: new fields.HTMLField({
        required: false,
        blank: true
      }),

      // Stats
      stats: new fields.SchemaField({
        hp: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 1 })
        }),
        str: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        mag: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        skl: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        spd: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        lck: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        def: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 3, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        res: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        mov: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 15, integer: true, min: 0 })
        })
      }),

      // Growth Rates (percentage chance to increase stat on level up)
      growthRates: new fields.SchemaField({
        hp: new fields.NumberField({ required: true, initial: 70, integer: true, min: 0, max: 100 }),
        str: new fields.NumberField({ required: true, initial: 40, integer: true, min: 0, max: 100 }),
        mag: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 100 }),
        skl: new fields.NumberField({ required: true, initial: 50, integer: true, min: 0, max: 100 }),
        spd: new fields.NumberField({ required: true, initial: 50, integer: true, min: 0, max: 100 }),
        lck: new fields.NumberField({ required: true, initial: 40, integer: true, min: 0, max: 100 }),
        def: new fields.NumberField({ required: true, initial: 30, integer: true, min: 0, max: 100 }),
        res: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0, max: 100 }),
        mov: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 100 })
      }),

      // Weapon Ranks
      weaponRanks: new fields.SchemaField({
        sword: new fields.StringField({ required: true, initial: "E", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        lance: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        axe: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        bow: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        tome: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        staff: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] })
      }),

      // Derived stats (calculated in prepareDerivedData)
      derived: new fields.SchemaField({
        hit: new fields.NumberField({ required: false, initial: 0, integer: true }),
        avoid: new fields.NumberField({ required: false, initial: 0, integer: true }),
        crit: new fields.NumberField({ required: false, initial: 0, integer: true }),
        critAvoid: new fields.NumberField({ required: false, initial: 0, integer: true }),
        attackSpeed: new fields.NumberField({ required: false, initial: 0, integer: true }),
        attack: new fields.NumberField({ required: false, initial: 0, integer: true })
      })
    };
  }

  /**
   * Prepare base data before derived data
   */
  prepareBaseData() {
    // Any base data preparation
  }

  /**
   * Prepare derived data
   */
  prepareDerivedData() {
    // Derived data is calculated in actor.mjs
  }
}
