import apiClient from '../http/apiClient';
import { unwrap, unwrapResult } from '../http/response';
import { ENDPOINTS } from '../endpoints';

import personService from '../common/personService';
import eventService from '../common/eventService';
import locationService from '../common/locationService';
import participationService from './participationService';

const SIZE_LARGE = 500;
const SIZE_PARTICIPATIONS = 1000;

const ROLE_ENUMS = [
    'KING', 'QUEEN', 'PRINCE', 'PRINCESS', 'COMMANDER', 'GENERAL',
    'STRATEGIST', 'OFFICIAL', 'DIPLOMAT', 'SOLDIER', 'REBEL_LEADER',
    'ALLY', 'OPPONENT', 'WITNESS', 'HISTORIAN',
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

function buildGraphInternal({ persons, events, locations, participations }) {
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
            type: 'Địa danh',
            dynasties: l.dynasties || (l.dynasty ? [l.dynasty] : []),
            desc: (l.type || '') + ' (' + (l.coords || '') + ')',
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
                    relation: lr.relationType || 'Địa danh liên quan',
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
        if (
            p.person?.id &&
            p.event?.id
        ) {
            const sourceNodeId = `character_${p.person.id}`;
            const targetNodeId = `event_${p.event.id}`;
            if (nodeIds.has(sourceNodeId) && nodeIds.has(targetNodeId)) {
                links.push({
                    id: `part_${p.id}`,
                    source: sourceNodeId,
                    target: targetNodeId,
                    value: 3,
                    relation: p.note || p.role || 'Tham gia',
                    isCustom: true,
                    isBackend: true,
                    backendType: 'participation',
                    backendId: p.id,
                });
            }
        }
    });

    return { nodes, links };
}

// ---- Service object ----------------------------------------------------------

const hubService = {
    async fetchGraph() {
        const [persons, events, locations, participationsPage] = await Promise.all([
            personService.listAll({ size: SIZE_LARGE }),
            eventService.listAll({ size: SIZE_LARGE }),
            locationService.listAll({ size: SIZE_LARGE }),
            participationService
                .filter({ size: SIZE_PARTICIPATIONS })
                .catch(() => ({ items: [] })),
        ]);

        return buildGraphInternal({
            persons: persons.map(buildPersonNode),
            events: events.map(buildEventNode),
            locations: locations.map(buildLocationNode),
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
};

export default hubService;