import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { metadataService, periodService, tagService } from '../../../services';

export const fetchMetadataOverview = createAsyncThunk(
  'metadata/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const { tags: liveTags = [], periods: livePeriods = [] } =
        await metadataService.fetchOverview().catch((err) => {
          console.error('Lỗi khi fetch overview metadata:', err);
          return { tags: [], periods: [] };
        });

      const finalTags = liveTags.map((t) => {
        let type = 'Khác';
        if (t.description && t.description.startsWith('Type: ')) {
          type = t.description.replace('Type: ', '').trim();
        }
        return { id: t.id, name: t.name, slug: t.slug, type, count: 0 };
      });

      const formatYear = (y) => {
        if (y === undefined || y === null || y === '') return '';
        const val = parseInt(y, 10);
        if (isNaN(val)) return y;
        return val < 0 ? `${Math.abs(val)} TCN` : `${val}`;
      };

      const finalPeriods = livePeriods.map((p) => {
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          timeRange: `${formatYear(p.startYear)} - ${formatYear(p.endYear)}`,
          description: p.description || '',
          count: 0,
        };
      });

      const stats = [
        { id: 1, label: 'Thẻ phân loại (Tags)', value: finalTags.length, icon: 'label', color: 'text-indigo-600' },
        { id: 2, label: 'Triều đại / Giai đoạn', value: finalPeriods.length, icon: 'history', color: 'text-amber-600' }
      ];

      return {
        stats,
        categories: [],
        tags: finalTags,
        periods: finalPeriods
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
    data: { stats: [], categories: [], tags: [], periods: [] },
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
