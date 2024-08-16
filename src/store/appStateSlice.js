import { createSlice } from "@reduxjs/toolkit";

export const states = {
    initial: 0,
    loadAssets: 1,
    loadSettings: 2,
    initApp: 3,
    initScene: 4,
    initSnake: 5,
    startGame: 6,
}

export const appStateSlice = createSlice({
    name: "appState",
    initialState: states.initial,
    reducers: {
        setAppState(state, {payload}){
            return payload;
        }
    }
});

export const {setAppState} = appStateSlice.actions;
export default appStateSlice.reducer;
