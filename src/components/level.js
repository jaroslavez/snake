import styles from "@/styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAppState, states } from "@/store/appStateSlice.js";

export default function Level({settings, textureGrass}) {
  const canvasRef = useRef(null);
  const IsComponentMount = useRef(false);
  const dispatch = useDispatch();
  const stateApp = useSelector((store) => store.appState);
  const [snake, setSnake] = useState(null);

  useEffect(() => {
    IsComponentMount.current = true;

    let controller;

    let isButtonPressed = false;

    let animationFrameID = null;

    (async () => {
      
      
      const { Snake } = await import("../snake.js");

      const { InputController } = await import("../input-controller.js");
      const { actionsToBind } = await import("../actionsToBind.js");

      if(!IsComponentMount.current) {
        return;
      }
      const snakeInstance = new Snake(canvasRef.current);
      setSnake(snakeInstance);

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
        snakeInstance.changeDirection(e.detail.nameAction);
      }
      
    })();

    return () => {  
      IsComponentMount.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      if(!snake)
        return;
      const newState = await snake.applyState(stateApp, {settings, textureGrass});
      newState && dispatch(setAppState(newState));
      
    })();

  }, [stateApp, snake]);


  return (
    <canvas id={styles["canvas-with-game"]} ref={canvasRef} tabIndex="0"></canvas>
  );
}
