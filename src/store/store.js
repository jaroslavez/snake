import { configureStore } from "@reduxjs/toolkit";
import appStateSlice from "./appStateSlice";

export const store = configureStore({
    reducer: {
        appState: appStateSlice,
    },
})

