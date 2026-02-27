import { createSlice } from '@reduxjs/toolkit';

type UiState = {
  searchOpen: boolean;
};

const initialState: UiState = {
  searchOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openSearch: (state) => {
      state.searchOpen = true;
    },
    closeSearch: (state) => {
      state.searchOpen = false;
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
  },
});

export const { openSearch, closeSearch, toggleSearch } = uiSlice.actions;
export default uiSlice.reducer;
