import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { metadataService, periodService, tagService, postService, eventService, personService, locationService } from '../../../services';

export const fetchMetadataOverview = createAsyncThunk(
  'metadata/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const { tags: liveTags = [], periods: livePeriods = [] } =
        await metadataService.fetchOverview().catch((err) => {
          console.error('Lỗi khi fetch overview metadata:', err);
          return { tags: [], periods: [] };
        });

      let posts = [], events = [], characters = [], locations = [];
      try {
        const [pRes, eRes, cRes, lRes] = await Promise.all([
          postService.listAll({ size: 1000 }).catch(() => []),
          eventService.listAll({ size: 1000 }).catch(() => []),
          personService.listAll({ size: 1000 }).catch(() => []),
          locationService.listAll({ size: 1000 }).catch(() => [])
        ]);
        posts = pRes;
        events = eRes;
        characters = cRes;
        locations = lRes;
      } catch (e) {
        console.error('Lỗi khi fetch entities để đếm tag:', e);
      }

      const allUniqueTags = new Map();

      liveTags.forEach((t) => {
        let type = 'Khác';
        if (t.description && t.description.startsWith('Type: ')) {
          type = t.description.replace('Type: ', '').trim();
        }
        allUniqueTags.set((t.name || '').toLowerCase().trim(), {
           id: t.id, name: t.name, slug: t.slug, type, count: 0, isLive: true
        });
      });

      const addVirtualTag = (tagName) => {
         if (!tagName) return;
         const lower = tagName.toLowerCase().trim();
         if (!allUniqueTags.has(lower)) {
             allUniqueTags.set(lower, {
                 id: 'virtual_' + Date.now() + '_' + Math.random(),
                 name: tagName.trim(),
                 slug: tagName.trim(),
                 type: 'Tự do',
                 count: 0,
                 isLive: false
             });
         }
      };

      posts.forEach(a => {
          a.tags?.forEach(tag => {
              const name = typeof tag === 'string' ? tag : (tag.name || tag.label);
              addVirtualTag(name);
          });
      });



      const finalTags = Array.from(allUniqueTags.values()).map((t) => {
        const tagNameStr = t.name || '';
        const tagLower = tagNameStr.toLowerCase();

        let count = 0;

        count += posts.filter(a =>
          a.tags?.some(tag => {
             const n = typeof tag === 'string' ? tag : (tag.name || tag.label);
             return n?.toLowerCase() === tagLower || String(tag.id) === String(t.id);
          }) ||
          (a.title && a.title.toLowerCase().includes(tagLower)) ||
          (a.category && a.category.toLowerCase().includes(tagLower))
        ).length;

        count += events.filter(e => {
          const localData = localStorage.getItem(`local_event_relations_${e.id}`);
          let hasTag = false;
          if (localData) {
            try { hasTag = JSON.parse(localData).tags?.includes(tagNameStr); } catch(e) {}
          }
          const hasNameMatch = e.name && e.name.toLowerCase().includes(tagLower);
          return hasTag || hasNameMatch;
        }).length;

        count += characters.filter(c => {
          const localData = localStorage.getItem(`local_char_relations_${c.id}`);
          let hasTag = false;
          if (localData) {
            try { hasTag = JSON.parse(localData).tags?.includes(tagNameStr); } catch(e) {}
          }
          const hasNameMatch = c.name && c.name.toLowerCase().includes(tagLower);
          return hasTag || hasNameMatch;
        }).length;

        count += locations.filter(l => {
          const localData = localStorage.getItem(`local_loc_relations_${l.id}`);
          let hasTag = false;
          if (localData) {
            try { hasTag = JSON.parse(localData).tags?.includes(tagNameStr); } catch(e) {}
          }
          const hasNameMatch = l.name && l.name.toLowerCase().includes(tagLower);
          return hasTag || hasNameMatch;
        }).length;

        return { ...t, count };
      });

      const formatYear = (y) => {
        if (y === undefined || y === null || y === '') return '';
        const val = parseInt(y, 10);
        if (isNaN(val)) return y;
        return val < 0 ? `${Math.abs(val)} TCN` : `${val}`;
      };

      const safeParseArray = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
          } catch(e) {
            return val.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
        return [];
      };

      const finalPeriods = livePeriods.map((p) => {
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          startYear: p.startYear,
          endYear: p.endYear,
          timeRange: `${formatYear(p.startYear)} - ${formatYear(p.endYear)}`,
          range: `${formatYear(p.startYear)} - ${formatYear(p.endYear)}`,
          description: p.description || '',
          desc: p.description || '',
          philosophy: p.philosophy || '',
          emperors: safeParseArray(p.emperors),
          relatedEvents: safeParseArray(p.relatedEvents),
          relatedLocations: safeParseArray(p.relatedLocations),
          relatedArticles: safeParseArray(p.relatedArticles),
          imageUrl: p.imageUrl || p.avatar || p.image || null,
          status: p.status,
          count: 0,
        };
      });

      // Always sort periods chronologically by startYear
      finalPeriods.sort((a, b) => {
        const startA = a.startYear !== undefined && a.startYear !== null ? Number(a.startYear) : 999999;
        const startB = b.startYear !== undefined && b.startYear !== null ? Number(b.startYear) : 999999;
        return startA - startB;
      });

      const stats = [
        { id: 1, label: 'Thẻ phân loại (Tags)', value: finalTags.length, icon: 'label', color: 'text-indigo-600' },
        { id: 2, label: 'Triều đại / Giai đoạn', value: finalPeriods.length, icon: 'history', color: 'text-amber-600' }
      ];

      return {
        stats,
        categories: [],
        tags: finalTags,
        periods: finalPeriods,
        allEvents: events,
        allCharacters: characters,
        allLocations: locations,
        allPosts: posts
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteTag = createAsyncThunk('metadata/deleteTag', async (id) => {
  await tagService.delete(id);
  return id;
});

export const deletePeriod = createAsyncThunk('metadata/deletePeriod', async (id) => {
  await periodService.delete(id);
  return id;
});

const metadataSlice = createSlice({
  name: 'metadata',
  initialState: {
    data: { stats: [], categories: [], tags: [], periods: [], allEvents: [], allCharacters: [], allLocations: [], allPosts: [] },
    loading: false,
    error: null,
  },
  reducers: {
    deleteCategoryLocal: (state, action) => {
      const id = action.payload;
      const deleteRecursive = (cats) =>
        cats
          .filter((c) => c.id !== id)
          .map((c) => ({
            ...c,
            children: c.children ? deleteRecursive(c.children) : [],
          }));
      state.data.categories = deleteRecursive(state.data.categories);
    },
    reorderPeriodsLocal: (state, action) => {
      state.data.periods = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetadataOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetadataOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMetadataOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTag.fulfilled, (state, action) => {
        state.data.tags = state.data.tags.filter((t) => t.id !== action.payload);
      })
      .addCase(deletePeriod.fulfilled, (state, action) => {
        state.data.periods = state.data.periods.filter((p) => p.id !== action.payload);
      });
  },
});

export const { deleteCategoryLocal, reorderPeriodsLocal } = metadataSlice.actions;
export default metadataSlice.reducer;
