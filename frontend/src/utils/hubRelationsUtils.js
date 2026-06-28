import { hubService } from '../services';

export { hubService };

export const ENTITY_GROUPS = {
  character: { label: 'Nhân vật', icon: 'person' },
  event: { label: 'Sự kiện', icon: 'event' },
  location: { label: 'Địa danh', icon: 'location_on' },
};

export const RELATION_TYPE_META = {
  participation: {
    label: 'Nhân vật – Sự kiện',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  event_location: {
    label: 'Sự kiện – Địa danh',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  custom: {
    label: 'Tùy chỉnh',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
};

const resolveNode = (ref, nodes) => {
  if (ref && typeof ref === 'object') return ref;
  return nodes.find((n) => String(n.id) === String(ref)) || null;
};

export const linksToRelations = (links, nodes) =>
  links
    .map((link, idx) => {
      const source = resolveNode(link.source, nodes);
      const target = resolveNode(link.target, nodes);
      if (!source || !target) return null;

      const type = link.backendType || 'custom';
      const rowId = link.id || `rel_${source.id}_${target.id}_${idx}`;
      const relationLabel = link.relation || 'Liên kết';

      return {
        id: rowId,
        sourceId: source.id,
        sourceName: source.name,
        sourceGroup: source.group,
        targetId: target.id,
        targetName: target.name,
        targetGroup: target.group,
        relation: relationLabel,
        type,
        link,
        label: `${source.name} → ${relationLabel} → ${target.name}`,
      };
    })
    .filter(Boolean);

export async function fetchHubEntitiesAndRelations(
  _apiClient,
  _mockClient,
  _API_ENDPOINTS
) {
  const { nodes, links } = await hubService.fetchGraph();
  const relations = linksToRelations(links, nodes);
  return { nodes, links, relations };
}

export function deleteHubRelation(
  link
) {
  return hubService.deleteRelation(link);
}

export async function createHubRelation({ sourceNode, targetNode, relationText, nodes }) {
  const sNodeObj = nodes.find(
    (n) => n.name.toLowerCase() === sourceNode.trim().toLowerCase()
  );
  const tNodeObj = nodes.find(
    (n) => n.name.toLowerCase() === targetNode.trim().toLowerCase()
  );

  if (!sNodeObj) throw new Error(`NOT_FOUND_SOURCE:${sourceNode}`);
  if (!tNodeObj) throw new Error(`NOT_FOUND_TARGET:${targetNode}`);
  if (sNodeObj.id === tNodeObj.id) throw new Error('SELF_RELATION');

  await hubService.createRelation({
    sourceNode: sNodeObj,
    targetNode: tNodeObj,
    relationText,
  });
}