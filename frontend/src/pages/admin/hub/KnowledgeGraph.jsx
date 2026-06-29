import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import {
  AdminLayout,
  PageHeader,
  DataTable,
  ActionModal,
  TableActions,
} from '../../../components/admin';
import { hubService } from '../../../services';
import {
  ENTITY_GROUPS,
  RELATION_TYPE_META,
  linksToRelations,
} from '../../../utils/hubRelationsUtils';
import { getRelationLabel } from '../../../utils/relationUtils';

const EntityBadge = ({ group }) => {
  const meta = ENTITY_GROUPS[group] || { label: group, icon: 'category' };
  const colorClass =
    group === 'character'
      ? 'text-primary bg-primary/10 border-primary/20'
      : group === 'location'
        ? 'text-accent bg-accent/10 border-accent/20'
        : 'text-secondary bg-secondary/10 border-secondary/20';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorClass}`}
    >
      <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
      {meta.label}
    </span>
  );
};

const KnowledgeGraph = () => {
  const navigate = useNavigate();
  const graphRef = useRef();
  const containerRef = useRef();

  const [viewMode, setViewMode] = useState('table');
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', entityGroup: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, relation: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  const [relationText, setRelationText] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const graphData = { nodes, links };

  const loadData = async () => {
    try {
      setLoading(true);
      const { nodes: newNodes, links: newLinks } = await hubService.fetchGraph();
      const mergedLinks = [...newLinks];
      const newRelations = linksToRelations(mergedLinks, newNodes);
      setNodes(newNodes);
      setLinks(mergedLinks);
      setRelations(newRelations);
    } catch (error) {
      console.error('Error fetching relation data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewMode !== 'graph') return undefined;
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const participationCount = relations.filter((r) => r.type === 'participation').length;
  const eventLocationCount = relations.filter((r) => r.type === 'event_location').length;
  const customCount = relations.filter((r) => r.type === 'custom').length;
  const stats = {
    total: relations.length.toLocaleString(),
    participation: participationCount.toLocaleString(),
    eventLocation: eventLocationCount.toLocaleString(),
    custom: customCount.toLocaleString(),
  };

  const filteredRelations = relations.filter((row) => {
    const q = filters.search.toLowerCase();
    const matchSearch =
      !q ||
      row.sourceName?.toLowerCase().includes(q) ||
      row.targetName?.toLowerCase().includes(q) ||
      row.relation?.toLowerCase().includes(q);
    const matchType = filters.type ? row.type === filters.type : true;
    const matchGroup = filters.entityGroup
      ? row.sourceGroup === filters.entityGroup || row.targetGroup === filters.entityGroup
      : true;
    return matchSearch && matchType && matchGroup;
  });

  let previewGraphData = graphData;
  if (selectedEntity) {
    const neighborIds = new Set([String(selectedEntity.id)]);
    links.forEach((l) => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if (String(sId) === String(selectedEntity.id)) neighborIds.add(String(tId));
      if (String(tId) === String(selectedEntity.id)) neighborIds.add(String(sId));
    });
    previewGraphData = {
      nodes: nodes.filter((n) => neighborIds.has(String(n.id))),
      links: links.filter((l) => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        return neighborIds.has(String(sId)) && neighborIds.has(String(tId));
      }),
    };
  }

  const handleDelete = async () => {
    if (!deleteModal.relation?.link) return;
    try {
      setLoading(true);
      await hubService.deleteRelation(deleteModal.relation.link);
      setDeleteModal({ open: false, relation: null });
      await loadData();
    } catch (error) {
      console.error('Lỗi khi xóa mối quan hệ:', error);
      alert('Có lỗi xảy ra khi xóa mối quan hệ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRelation = async (e) => {
    e.preventDefault();
    if (!sourceNode.trim() || !targetNode.trim() || !relationText.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    const sNodeObj = nodes.find(
      (n) => n.name.toLowerCase() === sourceNode.trim().toLowerCase()
    );
    const tNodeObj = nodes.find(
      (n) => n.name.toLowerCase() === targetNode.trim().toLowerCase()
    );

    const exists = relations.some(
      (r) =>
        (String(r.sourceId) === String(sNodeObj?.id) &&
          String(r.targetId) === String(tNodeObj?.id)) ||
        (String(r.targetId) === String(sNodeObj?.id) &&
          String(r.sourceId) === String(tNodeObj?.id))
    );
    if (exists) {
      alert('Mối quan hệ giữa hai thực thể này đã tồn tại.');
      return;
    }

    try {
      setLoading(true);
      const isPersonAndEvent =
        (sNodeObj?.group === 'character' && tNodeObj?.group === 'event') ||
        (sNodeObj?.group === 'event' && tNodeObj?.group === 'character');
      const isEventAndLocation =
        (sNodeObj?.group === 'event' && tNodeObj?.group === 'location') ||
        (sNodeObj?.group === 'location' && tNodeObj?.group === 'event');

      if (isPersonAndEvent || isEventAndLocation) {
        await hubService.createRelation({
          sourceNode: sNodeObj,
          targetNode: tNodeObj,
          relationText,
        });
      } else {
        throw new Error('UNSUPPORTED_RELATION_TYPE');
      }
      setSourceNode('');
      setTargetNode('');
      setRelationText('');
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      const msg = error.message || '';
      if (msg === 'UNSUPPORTED_RELATION_TYPE') {
        alert('Hệ thống hiện tại chỉ hỗ trợ liên kết Nhân vật – Sự kiện và Sự kiện – Địa danh.');
      } else if (msg.startsWith('NOT_FOUND_SOURCE:')) {
        alert(`Không tìm thấy thực thể: "${msg.split(':')[1]}"`);
      } else if (msg.startsWith('NOT_FOUND_TARGET:')) {
        alert(`Không tìm thấy thực thể: "${msg.split(':')[1]}"`);
      } else if (msg === 'SELF_RELATION') {
        alert('Không thể tạo mối quan hệ của một thực thể với chính nó.');
      } else {
        console.error('Lỗi khi lưu mối quan hệ:', error);
        alert('Có lỗi xảy ra khi tạo mối quan hệ.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = useCallback(() => {
    if (graphRef.current) graphRef.current.zoom(graphRef.current.zoom() * 1.5, 400);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) graphRef.current.zoom(graphRef.current.zoom() / 1.5, 400);
  }, []);

  const handleFitCenter = useCallback(() => {
    if (graphRef.current) graphRef.current.zoomToFit(600, 50);
  }, []);

  const drawNode = useCallback(
    (node, ctx, globalScale) => {
      const colors = { character: '#312b2a', location: '#89716f', event: '#a29583' };
      const radius = 6;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = colors[node.group] || '#999';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = `bold ${14 / globalScale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1c1b1b';
      ctx.fillText(node.name, node.x, node.y + radius + (8 / globalScale));
      if (selectedEntity && selectedEntity.id === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }
    },
    [selectedEntity]
  );

  const columns = [
    {
      key: 'source',
      header: 'Thực thể nguồn',
      render: (row) => {
        const rawSourceId = String(row.sourceId).replace(/^(character|event|location)_/, '');
        let editUrl = '';
        if (row.sourceGroup === 'character') editUrl = `/admin/characters/edit/${rawSourceId}`;
        else if (row.sourceGroup === 'event') editUrl = `/admin/events/edit/${rawSourceId}`;
        else if (row.sourceGroup === 'location') editUrl = `/admin/locations/edit/${rawSourceId}`;

        return (
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="min-w-0">
              <div className="font-headline font-bold text-on-surface truncate">{row.sourceName}</div>
              <EntityBadge group={row.sourceGroup} />
            </div>
            <div className="flex gap-1 shrink-0">
              {editUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(editUrl);
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-surface-low border border-outline-variant text-on-surface-variant hover:bg-primary hover:text-white rounded-lg transition-all cursor-pointer"
                  title={`Chỉnh sửa ${row.sourceGroup === 'character' ? 'Nhân vật' : row.sourceGroup === 'event' ? 'Sự kiện' : 'Địa danh'}`}
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/hub/edit/${row.sourceId}`);
                }}
                className="w-7 h-7 flex items-center justify-center bg-surface-low border border-outline-variant text-on-surface-variant hover:bg-secondary hover:text-white rounded-lg transition-all cursor-pointer"
                title="Chỉnh sửa liên kết của thực thể này"
              >
                <span className="material-symbols-outlined text-[15px]">hub</span>
              </button>
            </div>
          </div>
        );
      },
    },
    {
      key: 'relation',
      header: 'Mối quan hệ',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
          <span className="material-symbols-outlined text-[14px]">sync_alt</span>
          {getRelationLabel(row.relation)}
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Thực thể đích',
      render: (row) => {
        const rawTargetId = String(row.targetId).replace(/^(character|event|location)_/, '');
        let editUrl = '';
        if (row.targetGroup === 'character') editUrl = `/admin/characters/edit/${rawTargetId}`;
        else if (row.targetGroup === 'event') editUrl = `/admin/events/edit/${rawTargetId}`;
        else if (row.targetGroup === 'location') editUrl = `/admin/locations/edit/${rawTargetId}`;

        return (
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="min-w-0">
              <div className="font-headline font-bold text-on-surface truncate">{row.targetName}</div>
              <EntityBadge group={row.targetGroup} />
            </div>
            <div className="flex gap-1 shrink-0">
              {editUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(editUrl);
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-surface-low border border-outline-variant text-on-surface-variant hover:bg-primary hover:text-white rounded-lg transition-all cursor-pointer"
                  title={`Chỉnh sửa ${row.targetGroup === 'character' ? 'Nhân vật' : row.targetGroup === 'event' ? 'Sự kiện' : 'Địa danh'}`}
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/hub/edit/${row.targetId}`);
                }}
                className="w-7 h-7 flex items-center justify-center bg-surface-low border border-outline-variant text-on-surface-variant hover:bg-secondary hover:text-white rounded-lg transition-all cursor-pointer"
                title="Chỉnh sửa liên kết của thực thể này"
              >
                <span className="material-symbols-outlined text-[15px]">hub</span>
              </button>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Loại',
      align: 'center',
      render: (row) => {
        const meta = RELATION_TYPE_META[row.type] || RELATION_TYPE_META.custom;
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}>
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (row) => (
        <TableActions
          onEdit={() => navigate(`/admin/hub/edit/${row.sourceId}`)}
          onDelete={() => setDeleteModal({ open: true, relation: row })}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader
          title="Quản lý Mối quan hệ"
          subtitle="Quản trị liên kết giữa nhân vật, sự kiện và địa danh trong hệ thống."
          actionLabel="Thêm quan hệ"
          actionIcon="add"
          onActionClick={() => setIsModalOpen(true)}
        />

        

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'table'
              ? 'bg-primary text-white shadow-md'
              : 'bg-surface-low border border-outline-variant text-on-surface-variant hover:border-primary/30'
              }`}
          >
            <span className="material-symbols-outlined text-sm align-middle mr-1">table_rows</span>
            Bảng dữ liệu
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'graph'
              ? 'bg-primary text-white shadow-md'
              : 'bg-surface-low border border-outline-variant text-on-surface-variant hover:border-primary/30'
              }`}
          >
            <span className="material-symbols-outlined text-sm align-middle mr-1">account_tree</span>
            Sơ đồ xem trước
          </button>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant bg-surface-low/50">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên thực thể hoặc loại quan hệ..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-primary min-w-[180px]"
                  >
                    <option value="">Tất cả loại quan hệ</option>
                    <option value="participation">Nhân vật – Sự kiện</option>
                    <option value="event_location">Sự kiện – Địa danh</option>
                    <option value="custom">Tùy chỉnh</option>
                  </select>
                  <select
                    value={filters.entityGroup}
                    onChange={(e) => setFilters((prev) => ({ ...prev, entityGroup: e.target.value }))}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-primary min-w-[160px]"
                  >
                    <option value="">Tất cả thực thể</option>
                    <option value="character">Nhân vật</option>
                    <option value="event">Sự kiện</option>
                    <option value="location">Địa danh</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-0">
              <DataTable
                columns={columns}
                data={filteredRelations}
                loading={loading}
                emptyMessage="Chưa có mối quan hệ nào. Nhấn «Thêm quan hệ» để bắt đầu."
                rowKey="id"
                onRowClick={(row) => {
                  setSelectedEntity(nodes.find((n) => String(n.id) === String(row.sourceId)) || null);
                  setViewMode('graph');
                }}
                striped={false}
                className="border-0 shadow-none rounded-none"
              />
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-low/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-headline font-bold text-on-surface">
                  {selectedEntity ? `Quan hệ quanh: ${selectedEntity.name}` : 'Toàn bộ mạng lưới quan hệ'}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {selectedEntity
                    ? 'Chỉ hiển thị các liên kết trực tiếp. Click bảng dữ liệu để chọn trung tâm.'
                    : `${relations.length} quan hệ có thể quản trị`}
                </p>
              </div>
              {selectedEntity && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      let editUrl = '';
                      const rawId = String(selectedEntity.id).replace(/^(character|event|location)_/, '');
                      if (selectedEntity.group === 'character') editUrl = `/admin/characters/edit/${rawId}`;
                      else if (selectedEntity.group === 'event') editUrl = `/admin/events/edit/${rawId}`;
                      else if (selectedEntity.group === 'location') editUrl = `/admin/locations/edit/${rawId}`;
                      if (editUrl) navigate(editUrl);
                    }}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary text-white border border-primary rounded-lg hover:bg-primary/95 transition-all cursor-pointer"
                  >
                    Chỉnh sửa thực thể
                  </button>
                  <button
                    onClick={() => navigate(`/admin/hub/edit/${selectedEntity.id}`)}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-surface-low border border-outline-variant hover:border-primary/50 text-on-surface-variant hover:text-primary rounded-lg transition-all cursor-pointer"
                  >
                    Chỉnh sửa liên kết
                  </button>
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-outline-variant rounded-lg hover:bg-surface-low transition-all cursor-pointer"
                  >
                    Xem toàn bộ
                  </button>
                </div>
              )}
            </div>
            <div ref={containerRef} className="relative h-[520px] bg-surface">
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white/90 border border-outline-variant p-1 rounded-lg shadow-lg">
                <button onClick={handleZoomIn} className="p-1.5 hover:bg-primary/10 rounded transition-all" title="Phóng to">
                  <span className="material-symbols-outlined text-sm">zoom_in</span>
                </button>
                <button onClick={handleZoomOut} className="p-1.5 hover:bg-primary/10 rounded transition-all" title="Thu nhỏ">
                  <span className="material-symbols-outlined text-sm">zoom_out</span>
                </button>
                <div className="w-px h-4 bg-outline-variant mx-1" />
                <button onClick={handleFitCenter} className="p-1.5 hover:bg-primary/10 rounded transition-all text-[10px] font-bold px-3">
                  Căn chỉnh
                </button>
              </div>
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant text-sm">
                  Đang tải...
                </div>
              ) : (
                <ForceGraph2D
                  ref={graphRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  graphData={selectedEntity ? previewGraphData : graphData}
                  nodeLabel={(node) => {
                    return `<div style="background:rgba(30,41,59,0.95);color:#fff;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:bold;line-height:1.4;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                      <div>${node.name} <span style="font-size:9px;opacity:0.7;padding-left:4px;">(${node.type})</span></div>
                      <div style="font-weight:normal;opacity:0.8;font-size:9px;margin-top:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;">
                        Nhấp đúp để chỉnh sửa thực thể
                      </div>
                    </div>`;
                  }}
                  nodeCanvasObject={drawNode}
                  onNodeClick={(node) => setSelectedEntity(node)}
                  onNodeDoubleClick={(node) => {
                    const rawId = String(node.id).replace(/^(character|event|location)_/, '');
                    let editUrl = '';
                    if (node.group === 'character') editUrl = `/admin/characters/edit/${rawId}`;
                    else if (node.group === 'event') editUrl = `/admin/events/edit/${rawId}`;
                    else if (node.group === 'location') editUrl = `/admin/locations/edit/${rawId}`;
                    if (editUrl) navigate(editUrl);
                  }}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleSpeed={(d) => (d.value || 2) * 0.005}
                  linkColor={() => 'rgba(75, 0, 4, 0.2)'}
                  linkWidth={(d) => d.value || 2}
                  linkLabel={(link) => {
                    const sName =
                      typeof link.source === 'object'
                        ? link.source.name
                        : nodes.find((n) => n.id === link.source)?.name;
                    const tName =
                      typeof link.target === 'object'
                        ? link.target.name
                        : nodes.find((n) => n.id === link.target)?.name;
                    return `<div style="background:rgba(30,41,59,0.95);color:#fff;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:bold;line-height:1.4;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                      <div>${sName} → ${getRelationLabel(link.relation || 'Liên kết')} → ${tName}</div>
                      <div style="font-weight:normal;opacity:0.8;font-size:9px;margin-top:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;">
                        Nhấp đúp để chỉnh sửa các mối liên kết
                      </div>
                    </div>`;
                  }}
                  onLinkDoubleClick={(link) => {
                    const sId = typeof link.source === 'object' ? link.source.id : link.source;
                    navigate(`/admin/hub/edit/${sId}`);
                  }}
                  d3VelocityDecay={0.3}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, relation: null })}
        type="delete"
        item={{ name: deleteModal.relation?.label }}
        onConfirm={handleDelete}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-[2rem] border border-outline-variant shadow-2xl max-w-md w-full p-8 space-y-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer"
            >
              close
            </button>
            <div className="space-y-1">
              <h3 className="font-headline text-2xl text-primary font-bold">Thêm Mối Quan Hệ</h3>
              <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest">
                Nhân vật–Sự kiện và Sự kiện–Địa danh lưu vào DB; các loại khác lưu tùy chỉnh
              </p>
            </div>
            <form onSubmit={handleSaveRelation} className="space-y-5">
              <div className="space-y-2">
                <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Thực thể nguồn</label>
                <input
                  type="text"
                  list="nodes-source"
                  value={sourceNode}
                  onChange={(e) => setSourceNode(e.target.value)}
                  placeholder="Nhân vật, sự kiện hoặc địa danh..."
                  className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <datalist id="nodes-source">
                  {nodes.map((n) => (
                    <option key={n.id} value={n.name}>{n.type} - {n.dynasty || 'Khác'}</option>
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Thực thể đích</label>
                <input
                  type="text"
                  list="nodes-target"
                  value={targetNode}
                  onChange={(e) => setTargetNode(e.target.value)}
                  placeholder="Nhân vật, sự kiện hoặc địa danh..."
                  className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <datalist id="nodes-target">
                  {nodes.map((n) => (
                    <option key={n.id} value={n.name}>{n.type} - {n.dynasty || 'Khác'}</option>
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Mối quan hệ</label>
                <input
                  type="text"
                  value={relationText}
                  onChange={(e) => setRelationText(e.target.value)}
                  placeholder="Vd: Tướng lĩnh, Nơi diễn ra trận chiến..."
                  className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-primary/30 text-primary rounded-xl font-bold text-xs uppercase tracking-widest">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md">
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default KnowledgeGraph;
