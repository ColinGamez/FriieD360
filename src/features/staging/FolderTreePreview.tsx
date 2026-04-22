import React from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { ContentItem } from '../../types';
import { buildContentRelativePath } from '../../utils/contentPaths';

interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  children?: Record<string, TreeNode>;
  size?: number;
}

export const FolderTreePreview = ({ items, contentOwnerId }: { items: ContentItem[]; contentOwnerId?: string }) => {
  const tree = React.useMemo(() => {
    const root: TreeNode = { name: 'Root', type: 'folder', children: {} };

    items.forEach(item => {
      const pathParts = buildContentRelativePath(item, { contentOwnerId }).split('/').slice(0, -1);
      let current = root;

      pathParts.forEach(part => {
        if (!current.children![part]) {
          current.children![part] = { name: part, type: 'folder', children: {} };
        }
        current = current.children![part];
      });

      current.children![item.fileName] = { name: item.fileName, type: 'file', size: item.size };
    });

    return root;
  }, [contentOwnerId, items]);

  return (
    <div className="bg-surface-panel border border-surface-border rounded-xl p-4 font-mono text-xs overflow-x-auto">
      <TreeItem node={tree} depth={0} defaultOpen={true} />
    </div>
  );
};

const TreeItem = ({ node, depth, defaultOpen = false }: { node: TreeNode, depth: number, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const hasChildren = node.children && Object.keys(node.children).length > 0;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1 px-2 rounded hover:bg-white/5 cursor-pointer transition-colors ${depth === 0 ? 'hidden' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {node.type === 'folder' ? (
          <>
            {hasChildren ? (
              isOpen ? <ChevronDown size={14} className="mr-1 text-gray-500" /> : <ChevronRight size={14} className="mr-1 text-gray-500" />
            ) : <div className="w-[18px]" />}
            <Folder size={14} className="mr-2 text-xbox-green/70" />
          </>
        ) : (
          <>
            <div className="w-[18px]" />
            <File size={14} className="mr-2 text-gray-400" />
          </>
        )}
        <span className={node.type === 'folder' ? 'font-bold text-gray-300' : 'text-gray-400'}>{node.name}</span>
        {node.size && <span className="ml-auto text-[10px] text-gray-600">{(node.size / 1024 / 1024).toFixed(1)}MB</span>}
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {Object.values(node.children!).sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
          }).map((child, idx) => (
            <TreeItem key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
