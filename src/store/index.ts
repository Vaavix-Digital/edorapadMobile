import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './slices/authSlice';
import attendanceReducer from './slices/attendanceSlice';
import instituteReducer from './slices/instituteSlice';
import tutorReducer from './slices/tutorSlice';
import studentReducer from './slices/studentSlice';
import parentReducer from './slices/parentSlice';
import communityReducer from './slices/communitySlice';
import certificateReducer from './slices/certificateSlice';
import accountReducer from './slices/accountSlice';

const rootPersistConfig = {
  key: 'edorapad_mobile_root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Persist auth state across mobile app launches
};

const rootReducer = combineReducers({
  auth: authReducer,
  attendance: attendanceReducer,
  institute: instituteReducer,
  tutor: tutorReducer,
  student: studentReducer,
  parent: parentReducer,
  community: communityReducer,
  certificate: certificateReducer,
  account: accountReducer,
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
