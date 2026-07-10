import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postService } from '../../../services';

export const fetchArticles = createAsyncThunk(
  'articles/fetch',
  async ({ page, size, search, status, tag, author }, { rejectWithValue }) => {
    try {
      const response = await postService.filter({
        page,
        size,
        search: search || undefined,
        status: status || undefined,
        tag: tag || undefined,
        authorId: author || undefined,
      });
      const posts = response.items || [];
      const totalElements = response.totalElements || posts.length;

      return {
        stats: [
          { id: 1, label: 'Tổng số bài viết', value: totalElements, icon: 'article', color: 'text-primary' },
          { id: 2, label: 'Đã xuất bản', value: posts.filter(p => p.status === 'PUBLISHED' || p.status === 'Công khai').length, icon: 'check_circle', color: 'text-emerald-600' }
        ],
        articles: posts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          summary: p.summary,
          tags: p.tags && p.tags.length > 0 ? p.tags.map(t => t.name) : ['Chưa rõ'],
          author: p.author?.fullName || p.author?.username || 'Admin',
          status: p.status
        }))
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteArticle = createAsyncThunk('articles/delete', async (id, { rejectWithValue }) => {
  try {
    await postService.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const articleSlice = createSlice({
  name: 'articles',
  initialState: {
    data: { stats: [], articles: [] },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.data.articles = state.data.articles.filter(a => String(a.id) !== String(action.payload));
        // You could also update stats here if you want to be fully accurate
      });
  },
});

export default articleSlice.reducer;
