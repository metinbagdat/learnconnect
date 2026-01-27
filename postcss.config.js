function removeWebkitTextSizeAdjust() {
  return {
    postcssPlugin: "remove-webkit-text-size-adjust",
    Declaration(decl) {
      if (decl.prop === "-webkit-text-size-adjust") decl.remove();
    },
  };
}
removeWebkitTextSizeAdjust.postcss = true;

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    removeWebkitTextSizeAdjust,
  },
};
