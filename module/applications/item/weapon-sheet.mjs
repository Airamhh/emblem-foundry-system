/**
 * Weapon Sheet for Weapon-type Items
 */
export default class WeaponSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["emblem", "sheet", "item", "weapon"],
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }

  /** @override */
  get template() {
    return `systems/emblem/templates/item/weapon-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    context.system = this.item.system;
    context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description, {async: true});
    
    // Weapon type options
    context.weaponTypes = {
      sword: "Sword",
      lance: "Lance",
      axe: "Axe",
      bow: "Bow",
      tome: "Tome",
      staff: "Staff",
      dragonstone: "Dragonstone",
      beast: "Beast"
    };
    
    // Rank options
    context.rankOptions = {
      E: "E",
      D: "D",
      C: "C",
      B: "B",
      A: "A",
      S: "S",
      Prf: "Prf"
    };
    
    // Magic type options
    context.magicTypes = {
      anima: "Anima",
      light: "Light",
      dark: "Dark",
      fire: "Fire",
      thunder: "Thunder",
      wind: "Wind",
      ice: "Ice"
    };
    
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
  }
}
