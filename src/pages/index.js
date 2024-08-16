import Head from "next/head";
import styles from "@/styles/Home.module.css";
import MainLayout from "@/layout/mainLayout";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";

import { setAppState } from "@/store/appStateSlice";

import { states } from "@/store/appStateSlice";

const Level = dynamic(() => import('../components/level'), {
  loading: () => null,
})

export default function Home() {
  const dispatch = useDispatch();
  
  const content = useRef(null);

  const settings = useRef(null);
  const textureGrass = useRef(null);
  const stateApp = useSelector((store) => store.appState);
  //console.log(stateApp)
  
  const currentFunction = {
    [states.initial]: async ({settings, dispatch}) => {
      const res = await axios.get(`/settings.json`);
      const data = res.data;
      settings.current = data;
      dispatch(setAppState(states.loadSettings))
    },
  
    [states.loadSettings]: async ({textureGrass, dispatch}) => {
      const THREE = await import("three");
      window.THREE = THREE;
  
      const loader = new THREE.TextureLoader();
      const texture = loader.load( '/grass.png' );
      textureGrass.current = texture;
      
      dispatch(setAppState(states.loadAssets));
    },
  
    [states.loadAssets]: async ({content, dispatch}) => {
      if(!Level)
        return;
      dispatch(setAppState(states.initApp));
      content.current = <Level settings={settings.current} textureGrass={textureGrass.current}/>;
    }
  }

  useEffect(() => {
    currentFunction[stateApp]?.({dispatch, settings, textureGrass, content});
  }, [Level, stateApp]);


  return (
    <>
      {content.current}
    </>
    
  );
}


Home.getLayout = function getLayout(page) {
  return (
    <MainLayout>
      {page}
    </MainLayout>
  )
}