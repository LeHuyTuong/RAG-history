import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventService } from '../../../services';
import { stripHtml } from '../../../utils/stringUtils';

export const fetchEvents = createAsyncThunk(
  'events/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { items: content } = await eventService.filter({ page: 0, size: 500 });

      const formatYear = (y) => {
        if (y === undefined || y === null || y === '') return '';
        const val = parseInt(y, 10);
        if (isNaN(val)) return y;
        return val < 0 ? `${Math.abs(val)} TCN` : `${val}`;
      };

      const formatRange = (start, end) => {
        const s = formatYear(start);
        const e = formatYear(end);
        if (!s && !e) return 'Chưa rõ';
        if (!s) return `? - ${e}`;
        if (!e) return `${s} - ?`;
        return `${s} - ${e}`;
      };

      const parseEventYear = (dateStr, fallbackYear) => {
        if (!dateStr) return fallbackYear;
        const isNegative = dateStr.startsWith('-');
        const cleanStr = isNegative ? dateStr.substring(1) : dateStr;
        const match = cleanStr.match(/^(\d{4})/);
        if (match) {
          const y = parseInt(match[1], 10);
          return isNegative ? -y : y;
        }
        return fallbackYear;
      };

      const events = content.map(e => ({
        ...e,
        time: formatRange(parseEventYear(e.startDate, e.startYear), parseEventYear(e.endDate, e.endYear)),
        dynasty: e.period?.name || 'Chưa rõ',
        status: e.status || 'published',
        sub: stripHtml(e.description)
      }));

      const total = events.length.toLocaleString();
      const published = events.filter(e => {
        const s = e.status || '';
        return s.toLowerCase() === 'published' || s.toLowerCase() === 'công khai';
      }).length.toLocaleString();

      return {
        events,
        stats: { total, published }
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteEvent = createAsyncThunk('events/delete', async (id, { rejectWithValue }) => {
  try {
    await eventService.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    data: { stats: { total: '0', published: '0' }, events: [] },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.data.events = state.data.events.filter(e => String(e.id) !== String(action.payload));
        // simple re-calc stats locally
        state.data.stats.total = state.data.events.length.toLocaleString();
        state.data.stats.published = state.data.events.filter(e => {
          const s = e.status || '';
          return s.toLowerCase() === 'published' || s.toLowerCase() === 'công khai';
        }).length.toLocaleString();
      });
  },
});

export default eventSlice.reducer;
