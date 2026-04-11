import { defineComponent, h } from "vue";

export default defineComponent({
  name: "SafeHtmlBlock",
  props: {
    html: { type: String, required: true },
    className: { type: String, default: "" },
  },
  render() {
    return h("div", {
      class: this.className,
      innerHTML: this.html,
    });
  },
});
