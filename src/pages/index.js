import Head from "next/head";
import styles from "@/styles/Home.module.css";
import MainLayout from "@/layout/mainLayout";
import { useEffect, useRef } from "react";
import axios from "axios";

export default function Home({data}) {
  const canvasRef = useRef(null);
  const IsComponentMount = useRef(false);

  useEffect(() => {
    IsComponentMount.current = true;

    let snake, controller;

    let isButtonPressed = false;

    let animationFrameID = null;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      
      const {Snake} = await import("../snake.js");
      const { gsap } = await import("gsap");

      const { InputController } = await import("../input-controller.js");
      const {actionsToBind} = await import("../actionsToBind.js");

      if(!IsComponentMount.current) {
        return;
      }
 

      window.OrbitControls = OrbitControls;
      window.THREE = THREE;
      window.gsap = gsap;

      snake = new Snake(canvasRef.current);
      snake.initScene();
      snake.initSnake(data);

      canvasRef.current.focus();
      canvasRef.current.addEventListener("click", (e) => e.target.focus());
      controller = new InputController(structuredClone(actionsToBind), canvasRef.current);
      canvasRef.current.addEventListener("input-controller:action-activated", (e) => {
        if(isButtonPressed)
          return;
        isButtonPressed = true;
        animateRotation(e);
        
      });
      canvasRef.current.addEventListener("input-controller:action-deactivated", (e) => {
        isButtonPressed = false;
        cancelAnimationFrame(animationFrameID);
      });

      function animateRotation(e){
        animationFrameID = requestAnimationFrame(() => animateRotation(e));
        if(!isButtonPressed){
          return;
        }
        snake.changeDirection(e.detail.nameAction);
      }
      
    })();

    return () => {
      if(snake){
        snake.destroy();
        //controller.detach();
      }
        
      IsComponentMount.current = false;
    };
  }, []);


  return (
    <canvas id={styles["canvas-with-game"]} ref={canvasRef} tabIndex="0"></canvas>
  );
}


Home.getLayout = function getLayout(page) {
  return (
    <MainLayout>
      {page}
    </MainLayout>
  )
}

export async function getServerSideProps() {
  let data;
  try{
    const res = await axios.get(`http://localhost:3000/settings.json`);
    data = res.data;
  }
  catch(e){
    console.log(e)
  }
 
  return { props: { data } }
}