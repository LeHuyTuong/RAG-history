import apiClient from '../http/apiClient';
import { unwrap, unwrapResult } from '../http/response';
import { ENDPOINTS } from '../endpoints';

import personService from '../common/personService';
import eventService from '../common/eventService';
import locationService from '../common/locationService';
import postService from '../common/postService';
import sourceService from '../common/sourceService';
import participationService from './participationService';

const SIZE_LARGE = 500;
const SIZE_PARTICIPATIONS = 1000;

const ROLE_ENUMS = [
    'KING', 'QUEEN', 'PRINCE', 'PRINCESS', 'COMMANDER', 'GENERAL',
    'STRATEGIST', 'OFFICIAL', 'DIPLOMAT', 'SOLDIER', 'LEADER', 'REBEL_LEADER',
    'ALLY', 'OPPONENT', 'WITNESS', 'HISTORIAN', 'FOUNDER', 'REFERENCE', 'AUTHOR'
];

// ---- Pure helper functions ---------------------------------------------------

const buildPersonNode = (p) => ({
    ...p,
    title: p.alias || '',
    years: `${p.birthDate ? new Date(p.birthDate).getFullYear() : '?'} - ${p.deathDate ? new Date(p.deathDate).getFullYear() : '?'}`,
    dynasty: p.dynasty || 'Chưa rõ',
    status: p.status || 'published',
});

const buildEventNode = (e) => ({
    ...e,
    time: `${e.startYear || '?'} - ${e.endYear || '?'}`,
    dynasty: e.period?.name || 'Chưa rõ',
    status: e.status || 'published',
    sub: e.description || '',
    locationRelations: e.locationRelations || [],
});

const buildLocationNode = (l) => ({
    id: l.id,
    name: l.name,
    type: l.locationType || 'UNKNOWN',
    coords: `${l.latitude || 0}, ${l.longitude || 0}`,
    description: l.description || '',
    status: 'PUBLISHED',
});

function matchRoleEnum(text) {
    const upper = (text || '').trim().toUpperCase();
    return ROLE_ENUMS.includes(upper) ? upper : null;
}

const buildArticleNode = (a) => ({
    id: a.id,
    name: a.title,
    group: 'article',
    type: 'Bài viết',
    status: a.status || 'published',
    desc: (a.category || '') + ' - ' + (a.author || ''),
});

const buildRecordNode = (r) => ({
    id: r.id,
    name: r.name || r.title,
    group: 'record',
    type: 'Sử liệu',
    status: r.status || 'published',
    desc: (r.author || '') + ' - ' + (r.dynasty || ''),
});

function buildGraphInternal({ persons, events, locations, articles, records, participations }) {
    const nodes = [];
    const links = [];

    persons.forEach((c) =>
        nodes.push({
            id: `character_${c.id}`,
            name: c.name,
            group: 'character',
            type: 'Nhân vật',
            dynasty: c.dynasty,
            desc: (c.title || c.role || '') + ' (' + (c.years || '') + ')',
        })
    );

    events.forEach((e) =>
        nodes.push({
            id: `event_${e.id}`,
            name: e.name,
            group: 'event',
            type: 'Sự kiện',
            dynasty: e.dynasty,
            desc: (e.sub || e.shortDesc || '') + ' (' + (e.time || '') + ')',
        })
    );

    locations.forEach((l) =>
        nodes.push({
            id: `location_${l.id}`,
            name: l.name,
            group: 'location',
            type: 'Di tích',
            dynasties: l.dynasties || (l.dynasty ? [l.dynasty] : []),
            desc: (l.type || '') + ' (' + (l.coords || '') + ')',
        })
    );

    (articles || []).forEach((a) =>
        nodes.push({
            id: `article_${a.id}`,
            name: a.name,
            group: 'article',
            type: 'Bài viết',
            desc: a.desc,
        })
    );

    (records || []).forEach((r) =>
        nodes.push({
            id: `record_${r.id}`,
            name: r.name,
            group: 'record',
            type: 'Sử liệu',
            desc: r.desc,
        })
    );

    const nodeIds = new Set(nodes.map((n) => String(n.id)));

    events.forEach((e) => {
        (e.locationRelations || []).forEach((lr) => {
            const locId = lr.locationId || lr.id;
            const sourceNodeId = `event_${e.id}`;
            const targetNodeId = `location_${locId}`;
            if (nodeIds.has(targetNodeId)) {
                links.push({
                    id: `el_${e.id}_${locId}`,
                    source: sourceNodeId,
                    target: targetNodeId,
                    value: 3,
                    relation: lr.relationType || 'Di tích liên quan',
                    isCustom: true,
                    isBackend: true,
                    backendType: 'event_location',
                    eventId: e.id,
                    locationId: locId,
                });
            }
        });
    });

    participations.forEach((p) => {
        const charNodeId = `character_${p.person?.id || p.personId}`;
        const eventNodeId = `event_${p.event?.id || p.eventId}`;
        if (nodeIds.has(charNodeId) && nodeIds.has(eventNodeId)) {
            links.push({
                id: `p_${p.id}`,
                source: charNodeId,
                target: eventNodeId,
                relation: p.role || 'Tham gia',
                isBackend: true,
                backendType: 'participation',
                backendId: p.id,
            });
        }
    });

    // Parse localStorage to get extra relations not supported by DB (parents, siblings, family, etc)
    const nameToNodeId = {};
    nodes.forEach(n => {
        nameToNodeId[n.name.toLowerCase()] = n.id;
        if (n.title) nameToNodeId[n.title.toLowerCase()] = n.id;
    });

    if (typeof window !== 'undefined' && window.localStorage) {
        persons.forEach(c => {
            const charNodeId = `character_${c.id}`;
            let localDataStr = localStorage.getItem(`local_char_relations_${c.id}`);
            if (!localDataStr && c.slug) {
                localDataStr = localStorage.getItem(`local_char_relations_${c.slug}`);
            }
            if (localDataStr) {
                try {
                    const data = JSON.parse(localDataStr);
                    const addCharRelation = (list, defaultRole) => {
                        if (Array.isArray(list)) {
                            list.forEach(rel => {
                                let rawName = typeof rel === 'string' ? rel : (rel?.name || '');
                                if (!rawName) return;

                                const relName = rawName.toString().toLowerCase().trim();
                                let targetNodeId = nameToNodeId[relName];

                                if (!targetNodeId) {
                                    const dummyId = `character_dummy_${Date.now()}_${Math.random()}`;
                                    nodes.push({
                                        id: dummyId,
                                        name: rawName,
                                        group: 'character',
                                        type: 'Nhân vật',
                                        dynasty: 'Chưa rõ',
                                        desc: 'Chưa có hồ sơ chi tiết',
                                    });
                                    nameToNodeId[relName] = dummyId;
                                    targetNodeId = dummyId;
                                }

                                if (targetNodeId && targetNodeId !== charNodeId) {
                                    links.push({
                                        id: `cc_${c.id}_${targetNodeId}_${Date.now()}_${Math.random()}`,
                                        source: charNodeId,
                                        target: targetNodeId,
                                        relation: (rel?.relation || defaultRole),
                                        isBackend: false,
                                    });
                                }
                            });
                        }
                    };

                    addCharRelation(data.parents, 'Cha/Mẹ');
                    addCharRelation(data.siblings, 'Anh/Chị/Em');
                    addCharRelation(data.family, 'Gia đình');
                    addCharRelation(data.relatedCharacters, 'Liên quan');
                } catch (e) { }
            }
        });

        events.forEach(e => {
            const eventNodeId = `event_${e.id}`;
            const localDataStr = localStorage.getItem(`local_event_relations_${e.id}`);
            if (localDataStr) {
                try {
                    const data = JSON.parse(localDataStr);
                    if (Array.isArray(data.relatedCharacters)) {
                        data.relatedCharacters.forEach(rel => {
                            let rawName = typeof rel === 'string' ? rel : (rel?.name || '');
                            if (!rawName) return;

                            const relName = rawName.toString().toLowerCase().trim();
                            let targetNodeId = nameToNodeId[relName];

                            if (!targetNodeId) {
                                const dummyId = `character_dummy_${Date.now()}_${Math.random()}`;
                                nodes.push({
                                    id: dummyId,
                                    name: rawName,
                                    group: 'character',
                                    type: 'Nhân vật',
                                    dynasty: 'Chưa rõ',
                                    desc: 'Chưa có hồ sơ chi tiết',
                                });
                                nameToNodeId[relName] = dummyId;
                                targetNodeId = dummyId;
                            }

                            if (targetNodeId && targetNodeId !== eventNodeId) {
                                // check if not already participation
                                const exists = links.some(l => (l.source === eventNodeId && l.target === targetNodeId) || (l.source === targetNodeId && l.target === eventNodeId));
                                if (!exists) {
                                    links.push({
                                        id: `ec_${e.id}_${targetNodeId}_${Date.now()}_${Math.random()}`,
                                        source: targetNodeId,
                                        target: eventNodeId,
                                        relation: 'Liên quan',
                                        isBackend: false,
                                        backendType: 'participation', // Thêm backendType để filter đúng
                                    });
                                }
                            }
                        });
                    }
                } catch (ex) { }
            }
        });

        locations.forEach(loc => {
            const locNodeId = `location_${loc.id}`;
            const localDataStr = localStorage.getItem(`local_location_relations_${loc.id}`);
            if (localDataStr) {
                try {
                    const data = JSON.parse(localDataStr);
                    // Location -> Characters
                    if (Array.isArray(data.relatedCharacters)) {
                        data.relatedCharacters.forEach(rel => {
                            let rawName = typeof rel === 'string' ? rel : (rel?.name || '');
                            if (!rawName) return;
                            const relName = rawName.toString().toLowerCase().trim();
                            let targetNodeId = nameToNodeId[relName];
                            if (!targetNodeId) {
                                const dummyId = `character_dummy_${Date.now()}_${Math.random()}`;
                                nodes.push({ id: dummyId, name: rawName, group: 'character', type: 'Nhân vật', dynasty: 'Chưa rõ', desc: 'Chưa có hồ sơ chi tiết' });
                                nameToNodeId[relName] = dummyId;
                                targetNodeId = dummyId;
                            }
                            if (targetNodeId && targetNodeId !== locNodeId) {
                                links.push({ id: `lc_${loc.id}_${targetNodeId}_${Date.now()}_${Math.random()}`, source: locNodeId, target: targetNodeId, relation: 'Nhân vật liên quan', isBackend: false, backendType: 'custom' });
                            }
                        });
                    }
                    // Location -> Events
                    if (Array.isArray(data.relatedEvents)) {
                        data.relatedEvents.forEach(rel => {
                            let rawName = typeof rel === 'string' ? rel : (rel?.name || '');
                            if (!rawName) return;
                            const relName = rawName.toString().toLowerCase().trim();
                            let targetNodeId = nameToNodeId[relName];
                            if (!targetNodeId) {
                                const dummyId = `event_dummy_${Date.now()}_${Math.random()}`;
                                nodes.push({ id: dummyId, name: rawName, group: 'event', type: 'Sự kiện', desc: 'Chưa có hồ sơ chi tiết' });
                                nameToNodeId[relName] = dummyId;
                                targetNodeId = dummyId;
                            }
                            if (targetNodeId && targetNodeId !== locNodeId) {
                                links.push({ id: `le_${loc.id}_${targetNodeId}_${Date.now()}_${Math.random()}`, source: locNodeId, target: targetNodeId, relation: 'Sự kiện liên quan', isBackend: false, backendType: 'custom' });
                            }
                        });
                    }
                } catch (ex) { }
            }
        });

        (articles || []).forEach(a => {
            const artNodeId = `article_${a.id}`;
            let localDataStr = localStorage.getItem(`local_post_relations_${a.id}`);
            if (!localDataStr && a.slug) {
                localDataStr = localStorage.getItem(`local_post_relations_${a.slug}`);
            }
            if (localDataStr) {
                try {
                    const data = JSON.parse(localDataStr);
                    const addArtRelation = (list, relationName) => {
                        if (Array.isArray(list)) {
                            list.forEach(rel => {
                                let rawName = typeof rel === 'string' ? rel : (rel?.name || '');
                                if (!rawName) return;
                                const relName = rawName.toString().toLowerCase().trim();
                                let targetNodeId = nameToNodeId[relName];
                                if (!targetNodeId) {
                                    const dummyId = `dummy_${Date.now()}_${Math.random()}`;
                                    nodes.push({ id: dummyId, name: rawName, group: 'character', type: 'Thực thể', desc: 'Chưa có hồ sơ chi tiết' });
                                    nameToNodeId[relName] = dummyId;
                                    targetNodeId = dummyId;
                                }
                                if (targetNodeId && targetNodeId !== artNodeId) {
                                    links.push({ id: `ar_${a.id}_${targetNodeId}_${Date.now()}_${Math.random()}`, source: artNodeId, target: targetNodeId, relation: relationName, isBackend: false, backendType: 'custom' });
                                }
                            });
                        }
                    };
                    addArtRelation(data.relatedCharacters, 'Nhân vật liên quan');
                    addArtRelation(data.relatedLocations, 'Di tích liên quan');
                } catch (e) {}
            }
        });

        (records || []).forEach(r => {
            const recNodeId = `record_${r.id}`;
            let localDataStr = localStorage.getItem(`local_record_relations_${r.id}`);
            if (!localDataStr && r.slug) {
                localDataStr = localStorage.getItem(`local_record_relations_${r.slug}`);
            }
            if (localDataStr) {
                try {
                    const data = JSON.parse(localDataStr);
                    const addRecRelation = (list, relationName) => {
                        if (Array.isArray(list)) {
                            list.forEach(rel => {
                                let rawName = typeof rel === 'string' ? rel : (rel?.name || '');
                                if (!rawName) return;
                                const relName = rawName.toString().toLowerCase().trim();
                                let targetNodeId = nameToNodeId[relName];
                                if (!targetNodeId) {
                                    const dummyId = `dummy_${Date.now()}_${Math.random()}`;
                                    nodes.push({ id: dummyId, name: rawName, group: 'character', type: 'Thực thể', desc: 'Chưa có hồ sơ chi tiết' });
                                    nameToNodeId[relName] = dummyId;
                                    targetNodeId = dummyId;
                                }
                                if (targetNodeId && targetNodeId !== recNodeId) {
                                    links.push({ id: `rr_${r.id}_${targetNodeId}_${Date.now()}_${Math.random()}`, source: recNodeId, target: targetNodeId, relation: relationName, isBackend: false, backendType: 'custom' });
                                }
                            });
                        }
                    };
                    addRecRelation(data.relatedCharacters, 'Nhân vật liên quan');
                    addRecRelation(data.relatedLocations, 'Di tích liên quan');
                    addRecRelation(data.relatedEvents, 'Sự kiện liên quan');
                } catch (e) {}
            }
        });
    }

    return { nodes, links };
}

// ---- Service object ----------------------------------------------------------


const hubService = {
    async fetchGraph() {
        let persons = [];
        let events = [];
        let locations = [];
        let articles = [];
        let records = [];
        let participationsPage = { items: [] };

        try {
            const [pRes, eRes, lRes, aRes, rRes, partRes] = await Promise.all([
                personService.listAll({ size: SIZE_LARGE }).catch(() => null),
                eventService.listAll({ size: SIZE_LARGE }).catch(() => null),
                locationService.listAll({ size: SIZE_LARGE }).catch(() => null),
                postService.listAll({ size: SIZE_LARGE }).catch(() => null),
                sourceService.listAll({ size: SIZE_LARGE }).catch(() => null),
                participationService.filter({ size: SIZE_PARTICIPATIONS }).catch(() => ({ items: [] })),
            ]);

            if (pRes) persons = pRes;
            else persons = [];

            if (eRes) events = eRes;
            else events = [];

            if (lRes) locations = lRes;
            else locations = [];

            if (aRes) articles = aRes;
            else articles = [];

            if (rRes) records = rRes;
            else records = [];

            participationsPage = partRes || { items: [] };
        } catch (err) {
            console.error('Error fetching hub data:', err);
        }

        return buildGraphInternal({
            persons: persons.map(buildPersonNode),
            events: events.map(buildEventNode),
            locations: locations.map(buildLocationNode),
            articles: articles.map(buildArticleNode),
            records: records.map(buildRecordNode),
            participations: participationsPage.items || [],
        });
    },

    buildGraphFromEntities({ persons = [], events = [], locations = [], participations = [] } = {}) {
        return buildGraphInternal({
            persons: persons.map(buildPersonNode),
            events: events.map(buildEventNode),
            locations: locations.map(buildLocationNode),
            participations,
        });
    },

    async deleteRelation(link) {
        if (!link?.isBackend) return;

        if (link.backendType === 'participation') {
            await participationService.delete(link.backendId);
            return;
        }

        if (link.backendType === 'event_location') {
            const event = await eventService.getById(link.eventId);
            const updatedLocationRelations = (event.locationRelations || [])
                .filter((lr) => String(lr.locationId) !== String(link.locationId))
                .map((lr) => ({
                    locationId: lr.locationId,
                    relationType: lr.relationType,
                }));

            await eventService.update(link.eventId, {
                name: event.name,
                slug: event.slug,
                description: event.description,
                startYear: event.startYear,
                endYear: event.endYear,
                startDate: event.startDate,
                endDate: event.endDate,
                certaintyLevel: event.certaintyLevel || 'CERTAIN',
                periodId: event.period?.id || null,
                locationRelations: updatedLocationRelations,
            });
        }
    },

    async createRelation({ sourceNode, targetNode, relationText }) {
        if (!sourceNode) throw new Error('NOT_FOUND_SOURCE');
        if (!targetNode) throw new Error('NOT_FOUND_TARGET');
        if (sourceNode.id === targetNode.id) throw new Error('SELF_RELATION');

        const isPersonAndEvent =
            (sourceNode.group === 'character' && targetNode.group === 'event') ||
            (sourceNode.group === 'event' && targetNode.group === 'character');

        const isEventAndLocation =
            (sourceNode.group === 'event' && targetNode.group === 'location') ||
            (sourceNode.group === 'location' && targetNode.group === 'event');

        if (isPersonAndEvent) {
            const personNode =
                sourceNode.group === 'character' ? sourceNode : targetNode;
            const eventNode =
                sourceNode.group === 'event' ? sourceNode : targetNode;

            const personId = Number(String(personNode.id).replace('character_', ''));
            const eventId = Number(String(eventNode.id).replace('event_', ''));

            await participationService.create({
                eventId: eventId,
                personId: personId,
                role: matchRoleEnum(relationText),
                note: relationText.trim(),
            });
            return;
        }

        if (isEventAndLocation) {
            const eventNode =
                sourceNode.group === 'event' ? sourceNode : targetNode;
            const locationNode =
                sourceNode.group === 'location' ? sourceNode : targetNode;

            const eventId = Number(String(eventNode.id).replace('event_', ''));
            const locationId = Number(String(locationNode.id).replace('location_', ''));

            const event = await eventService.getById(eventId);
            const updatedLocationRelations = (event.locationRelations || []).map((lr) => ({
                locationId: lr.locationId,
                relationType: lr.relationType,
            }));
            updatedLocationRelations.push({
                locationId: locationId,
                relationType: relationText.trim(),
            });

            await eventService.update(eventId, {
                name: event.name,
                slug: event.slug,
                description: event.description,
                startYear: event.startYear,
                endYear: event.endYear,
                startDate: event.startDate,
                endDate: event.endDate,
                certaintyLevel: event.certaintyLevel || 'CERTAIN',
                periodId: event.period?.id || null,
                locationRelations: updatedLocationRelations,
            });
            return;
        }

        throw new Error('UNSUPPORTED_RELATION_TYPE');
    },

    async fetchEntityFullRelations(type, cleanId, targetEntity = null) {
        const ownRelations = [];
        if (isNaN(Number(cleanId))) return ownRelations;

        if (type === 'character') {
            try {
                const partRes = await apiClient.get('/api/v1/admin/participations', {
                    params: { personId: cleanId, size: 500 }
                });
                const partData = partRes.data?.data?.result || partRes.data?.data || [];
                partData.forEach(p => {
                    if (p.event) {
                        ownRelations.push({
                            id: `part_${p.id}`,
                            targetId: p.event.id,
                            name: p.event.name,
                            type: 'Sự kiện',
                            group: 'event',
                            relation: p.note || p.role || 'Tham gia',
                            isCustom: true,
                            isBackend: true,
                            backendType: 'participation',
                            backendId: p.id
                        });
                    }
                });
            } catch (err) {
                console.error('Lỗi khi tải participations cho nhân vật:', err);
            }
        } else if (type === 'event') {
            try {
                const partRes = await apiClient.get('/api/v1/admin/participations', {
                    params: { eventId: cleanId, size: 500 }
                });
                const partData = partRes.data?.data?.result || partRes.data?.data || [];
                partData.forEach(p => {
                    if (p.person) {
                        ownRelations.push({
                            id: `part_${p.id}`,
                            targetId: p.person.id,
                            name: p.person.name,
                            type: 'Nhân vật',
                            group: 'character',
                            relation: p.note || p.role || 'Tham gia',
                            isCustom: true,
                            isBackend: true,
                            backendType: 'participation',
                            backendId: p.id
                        });
                    }
                });
            } catch (err) {
                console.error('Lỗi khi tải participations cho sự kiện:', err);
            }

            if (!targetEntity) {
                try {
                    const eventRes = await apiClient.get(`${ENDPOINTS.ADMIN_EVENTS}/${cleanId}`);
                    targetEntity = eventRes.data?.data || eventRes.data;
                } catch (e) {
                    console.error('Lỗi lấy chi tiết sự kiện:', e);
                }
            }

            if (targetEntity && targetEntity.locationRelations) {
                targetEntity.locationRelations.forEach(lr => {
                    ownRelations.push({
                        id: `el_${cleanId}_${lr.locationId}`,
                        targetId: lr.locationId,
                        name: lr.name,
                        type: 'Di tích',
                        group: 'location',
                        relation: lr.relationType || 'Di tích liên quan',
                        isCustom: true,
                        isBackend: true,
                        backendType: 'event_location',
                        eventId: cleanId,
                        locationId: lr.locationId
                    });
                });
            }
        } else if (type === 'location') {
            try {
                const eventRes = await apiClient.get(ENDPOINTS.ADMIN_EVENTS, { params: { size: 500 } });
                const eventData = eventRes.data?.data?.result || eventRes.data?.data?.content || [];
                eventData.forEach(event => {
                    if (event.locationRelations) {
                        const locRel = event.locationRelations.find(lr => String(lr.locationId) === String(cleanId));
                        if (locRel) {
                            ownRelations.push({
                                id: `el_${event.id}_${cleanId}`,
                                targetId: event.id,
                                name: event.name,
                                type: 'Sự kiện',
                                group: 'event',
                                relation: locRel.relationType || 'Di tích liên quan',
                                isCustom: true,
                                isBackend: true,
                                backendType: 'event_location',
                                eventId: event.id,
                                locationId: cleanId
                            });
                        }
                    }
                });
            } catch (err) {
                console.error('Lỗi khi tải danh sách sự kiện cho di tích:', err);
            }
        }

        return ownRelations;
    },
};

export default hubService;
