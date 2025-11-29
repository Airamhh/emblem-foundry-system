/**
 * Item Sheet for Item-type Items (Consumables)
 */
export default class EmblemItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["emblem", "sheet", "item", "consumable"],
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }

  /** @override */
  get template() {
    return `systems/emblem/templates/item/item-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    context.system = this.item.system;
    context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description, {async: true});
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
  }
}
