/**
 * Data Model for Class-type Items
 * Extends TypeDataModel (Foundry v13)
 */
export default class ClassData extends foundry.abstract.TypeDataModel {
  
  /**
   * Define the schema for class data
   */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      // Class Type
      classType: new fields.StringField({
        required: true,
        initial: "infantry",
        choices: ["infantry", "cavalry", "flying", "armored", "magic"]
      }),

      // Promotion Info
      promotionLevel: new fields.NumberField({
        required: true,
        initial: 10,
        integer: true,
        min: 1,
        max: 20
      }),

      promotedClass: new fields.BooleanField({
        required: true,
        initial: false
      }),

      promotesTo: new fields.StringField({
        required: false,
        initial: "",
        blank: true
      }),

      // Stat Bonuses
      statBonuses: new fields.SchemaField({
        hp: new fields.NumberField({ required: true, initial: 0, integer: true }),
        str: new fields.NumberField({ required: true, initial: 0, integer: true }),
        mag: new fields.NumberField({ required: true, initial: 0, integer: true }),
        skl: new fields.NumberField({ required: true, initial: 0, integer: true }),
        spd: new fields.NumberField({ required: true, initial: 0, integer: true }),
        lck: new fields.NumberField({ required: true, initial: 0, integer: true }),
        def: new fields.NumberField({ required: true, initial: 0, integer: true }),
        res: new fields.NumberField({ required: true, initial: 0, integer: true }),
        mov: new fields.NumberField({ required: true, initial: 0, integer: true })
      }),

      // Weapon Proficiencies
      weaponProficiency: new fields.SchemaField({
        sword: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        lance: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        axe: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        bow: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        tome: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] }),
        staff: new fields.StringField({ required: true, initial: "-", choices: ["E", "D", "C", "B", "A", "S", "-"] })
      }),

      // Class Skills (learned at specific levels)
      classSkills: new fields.ArrayField(
        new fields.SchemaField({
          skillName: new fields.StringField({ required: true, initial: "" }),
          learnLevel: new fields.NumberField({ required: true, initial: 1, integer: true, min: 1 })
        }),
        { required: false, initial: [] }
      ),

      // Description
      description: new fields.HTMLField({
        required: false,
        blank: true
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
    // Derived data is calculated in item.mjs
  }
}
