import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { personService, apiClient } from '../../../services';

export const fetchCharacters = createAsyncThunk(
  'characters/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const [personRes, partRes, eventRes] = await Promise.allSettled([
        personService.filter({ page: 0, size: 500 }),
        apiClient.get('/api/v1/admin/participations', { params: { size: 5000 } }),
        apiClient.get('/api/v1/admin/events', { params: { size: 500 } })
      ]);

      const content = personRes.status === 'fulfilled' ? personRes.value.items : [];
      const participationsList = partRes.status === 'fulfilled' ? (partRes.value.data?.data?.result || partRes.value.data?.data || []) : [];
      const eventsList = eventRes.status === 'fulfilled' ? (eventRes.value.data?.data?.result || eventRes.value.data?.data?.content || eventRes.value.data || []) : [];

      const eventPeriodMap = {};
      eventsList.forEach(e => {
        if (e.id && e.period?.name) {
          eventPeriodMap[e.id] = e.period.name;
        }
      });

      const personPeriodsMap = {};
      participationsList.forEach(p => {
        const personId = p.person?.id;
        const eventId = p.event?.id;
        if (personId && eventId) {
          const periodName = eventPeriodMap[eventId];
          if (periodName) {
            if (!personPeriodsMap[personId]) {
              personPeriodsMap[personId] = new Set();
            }
            personPeriodsMap[personId].add(periodName);
          }
        }
      });

      const parseCharacterYear = (dateStr) => {
        if (!dateStr) return null;
        const isNegative = dateStr.startsWith('-');
        const cleanStr = isNegative ? dateStr.substring(1) : dateStr;
        const match = cleanStr.match(/^(\d{4})/);
        if (match) {
          const y = parseInt(match[1], 10);
          return isNegative ? -y : y;
        }
        return null;
      };

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

      const mappedContent = content.map(c => {
        const dyns = new Set();

        const liveDyns = personPeriodsMap[c.id];
        if (liveDyns) {
          liveDyns.forEach(d => dyns.add(d));
        }

        const cached = localStorage.getItem(`local_char_relations_${c.id}`);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.dynasties && parsed.dynasties.length > 0) {
                    parsed.dynasties.forEach(d => dyns.add(d));
                }
            } catch(e) {}
        }

        const allDyns = Array.from(dyns).filter(Boolean);

        return {
          ...c,
          title: c.alias || '',
          years: formatRange(parseCharacterYear(c.birthDate), parseCharacterYear(c.deathDate)),
          dynasty: allDyns.length > 0 ? allDyns[0] : 'Chưa rõ',
          dynasties: allDyns,
          status: c.status || 'published'
        };
      });

      return {
        characters: mappedContent,
        stats: [
          { label: "Tổng số", value: mappedContent.length, trend: "+0", isPositive: true },
          { label: "Công khai", value: mappedContent.filter(c => c.status === 'published' || c.status === 'công khai').length, trend: "+0", isPositive: true },
          { label: "Bản nháp", value: mappedContent.filter(c => c.status === 'draft' || c.status === 'bản nháp').length, trend: "-0", isPositive: false }
        ]
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCharacter = createAsyncThunk('characters/delete', async (id, { rejectWithValue }) => {
  try {
    await personService.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const characterSlice = createSlice({
  name: 'characters',
  initialState: {
    data: { stats: [], characters: [] },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCharacters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharacters.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCharacter.fulfilled, (state, action) => {
        state.data.characters = state.data.characters.filter(c => String(c.id) !== String(action.payload));
      });
  },
});

export default characterSlice.reducer;
