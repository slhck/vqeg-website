const archivePages = new Set(['meetings.mdx', 'publications-and-software.mdx']);

function headingText(heading) {
  return heading.children
    .map((child) => child.value ?? '')
    .join('')
    .trim();
}

export default function archiveAccordions() {
  return (tree, file) => {
    if (!archivePages.has(file.path?.split('/').pop())) return;

    for (let index = 0; index < tree.children.length - 1; index += 1) {
      const heading = tree.children[index];
      const list = tree.children[index + 1];

      if (heading.type !== 'heading' || heading.depth !== 3 || list.type !== 'list') continue;

      tree.children.splice(index, 2, {
        type: 'mdxJsxFlowElement',
        name: 'details',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'class',
            value: 'vqeg-archive-accordion',
          },
        ],
        children: [
          {
            type: 'mdxJsxFlowElement',
            name: 'summary',
            attributes: [],
            children: heading.children,
          },
          list,
        ],
      });
    }

    if (file.path?.endsWith('/meetings.mdx')) {
      const meetingFilesIndex = tree.children.findIndex(
        (node) => node.type === 'heading' && headingText(node) === 'Meeting Files'
      );
      const acknowledgementsIndex = tree.children.findIndex(
        (node) => node.type === 'heading' && headingText(node) === 'Past Meeting Acknowledgements'
      );

      if (meetingFilesIndex !== -1 && acknowledgementsIndex > meetingFilesIndex) {
        const archives = tree.children.slice(meetingFilesIndex + 1, acknowledgementsIndex).reverse();
        tree.children.splice(meetingFilesIndex + 1, acknowledgementsIndex - meetingFilesIndex - 1, ...archives);
      }
    }
  };
}
