import { defineComponent, h } from "vue";
import DOMPurify from "dompurify";

export default defineComponent({
  name: "SafeHtmlBlock",
  props: {
    html: { type: String, required: true },
    className: { type: String, default: "" },
  },
  render() {
    return h("div", {
      class: this.className,
      innerHTML: DOMPurify.sanitize(this.html),
    });
  },
});
