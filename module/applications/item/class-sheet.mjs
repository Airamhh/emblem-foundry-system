/**
 * Class Sheet for Class-type Items
 */
export default class ClassSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["emblem", "sheet", "item", "class"],
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }

  /** @override */
  get template() {
    return `systems/emblem/templates/item/class-sheet.hbs`;
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
