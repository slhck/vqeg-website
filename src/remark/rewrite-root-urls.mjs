const isRootRelative = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');

export default function rewriteRootUrls({ base }) {
  const prefix = `${base.replace(/\/$/, '')}/`;

  return (tree) => {
    const visit = (node) => {
      if ((node.type === 'link' || node.type === 'image') && isRootRelative(node.url)) {
        node.url = `${prefix}${node.url.slice(1)}`;
      }

      if (node.type === 'html') {
        node.value = node.value.replace(
          /\b(href|src)=(['"])\/(?!\/)([^'"]*)\2/g,
          (_match, attribute, quote, path) => `${attribute}=${quote}${prefix}${path}${quote}`
        );
      }

      node.attributes?.forEach((attribute) => {
        if (
          attribute.type === 'mdxJsxAttribute' &&
          (attribute.name === 'href' || attribute.name === 'src') &&
          isRootRelative(attribute.value)
        ) {
          attribute.value = `${prefix}${attribute.value.slice(1)}`;
        }
      });

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}
