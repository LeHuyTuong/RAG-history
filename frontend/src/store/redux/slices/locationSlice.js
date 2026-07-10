import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { locationService } from '../../../services';

export const fetchLocations = createAsyncThunk(
  'locations/fetch',
  async (_, { rejectWithValue }) => {
    try {
      let dbLocations = [];
      let totalElements = 0;
      try {
        const res = await locationService.filter({ page: 0, size: 500 });
        dbLocations = res.items || [];
        totalElements = res.totalElements || dbLocations.length;
      } catch (apiErr) {
        console.error('Lỗi gọi API địa danh admin:', apiErr);
      }

      let merged = dbLocations.map(dbItem => {
        return {
          ...dbItem,
          id: dbItem.id,
          name: dbItem.name,
          type: dbItem.locationType || 'UNKNOWN',
          coords: `${dbItem.latitude || 0}, ${dbItem.longitude || 0}`,
          latitude: dbItem.latitude || null,
          longitude: dbItem.longitude || null,
          period: dbItem.period?.name || 'Chưa cập nhật',
          dynasties: dbItem.dynasty ? (Array.isArray(dbItem.dynasty) ? dbItem.dynasty : [dbItem.dynasty]) : [],
          status: dbItem.status || 'PUBLISHED',
          description: dbItem.description || '',
          image: '',
          famousCharacters: []
        };
      });

      return {
        locations: merged,
        stats: [
          { id: 1, label: 'Tổng số địa danh', value: totalElements || merged.length, icon: 'location_on', color: 'text-emerald-600' }
        ]
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteLocation = createAsyncThunk('locations/delete', async (id, { rejectWithValue }) => {
  try {
    await locationService.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const locationSlice = createSlice({
  name: 'locations',
  initialState: {
    data: { stats: [], locations: [] },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteLocation.fulfilled, (state, action) => {
        state.data.locations = state.data.locations.filter(loc => String(loc.id) !== String(action.payload));
      });
  },
});

export default locationSlice.reducer;
