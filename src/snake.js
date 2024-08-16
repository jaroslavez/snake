import { states } from "./store/appStateSlice";

export class Snake {
    //ThreeJS variables
    renderer = null;

    camera = null;

    scene = null;

    raycaster = null;

    pointer = null;

    head = null;

    uniforms = null;

    canvas = null;

    direction = "up";

    objectOfBody = [];

    cylinderHeight = null;

    headGroup = null;

    //animations variables

    animationComplete = true;

    isDestroyed = false;

    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.camera = new THREE.OrthographicCamera((-canvas.offsetHeight) / 800 , canvas.offsetHeight / 800, canvas.offsetHeight / 800, (-canvas.offsetHeight) / 800, 0.1, 300);


        this.scene = new THREE.Scene();

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        
        //Биндинги
        this.animationLoop = this.animationLoop.bind(this);
        this.initScene = this.initScene.bind(this);
        this.initSnake = this.initSnake.bind(this);
        this.changeDirection = this.changeDirection.bind(this);
        this.startGame = this.startGame.bind(this);
        this.applyState = this.applyState.bind(this);

    }

    applyState(state, props) {
        
        const currentFunction = {
            [states.initApp]: this.initScene,
            [states.initScene]: this.initSnake,
            [states.initSnake]: this.startGame,
        }

        return currentFunction[state]?.(props);
    }

    initScene({textureGrass}) {
        
        this.scene.background = new THREE.Color( 'lightblue' );

        this.camera.position.set( 0, 0, 100 );
        this.camera.zoom = 0.01;
        this.camera.updateProjectionMatrix();

        const planeSize = 20;


		textureGrass.wrapS = THREE.RepeatWrapping;
		textureGrass.wrapT = THREE.RepeatWrapping;
		textureGrass.magFilter = THREE.NearestFilter;
		textureGrass.colorSpace = THREE.SRGBColorSpace;
		const repeats = planeSize / 2;
		textureGrass.repeat.set( repeats, repeats);

		const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
		const planeMat = new THREE.MeshPhongMaterial( {
			map: textureGrass,
			side: THREE.DoubleSide,
		} );
		const ground = new THREE.Mesh( planeGeo, planeMat );
        ground.scale.set(10, 10)
		this.scene.add( ground );

        const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.AmbientLight( color, intensity );
		this.scene.add( light );
        
        return Promise.resolve(states.initScene);
    }

    initSnake({settings: {scale, heightOfSnake, speed}}) {
        this.speed = speed;
        this.uniforms = {
            u_time:      {type: 'float', value: Date.now()},
        };
        const radiusHead = 5 * scale;
        let geometry = new THREE.SphereGeometry(radiusHead, 15, 15);
        geometry.translate(0, radiusHead, 0);
        
        let material = new THREE.ShaderMaterial({
          uniforms: this.uniforms,
          fragmentShader: this.#fragmentShader(),
          vertexShader: this.#vertexShader(),
        })
        
        let head = new THREE.Mesh(geometry, material);
        this.head = head;
        
        head.position.y = radiusHead * scale;
        head.position.z = -radiusHead;
        this.headGroup = new THREE.Group();
        this.headGroup.add(head);
        this.headGroup.position.z = 10 * scale;

        head.rotateX(Math.PI / 2);
        head.rotateY(Math.PI)
        
        this.scene.add(this.headGroup);

        let previousPartOfBody = this.head;
        this.objectOfBody.push(this.headGroup);

        this.cylinderHeight = 10 * scale;

        for(let i = 0; i < heightOfSnake; i++) {
            const geometry = new THREE.CylinderGeometry(4 * scale, 4 * scale, this.cylinderHeight, 10);
            geometry.translate(0, this.cylinderHeight / 2, 0);
            geometry.rotateX(Math.PI / 2);
            

            const material = new THREE.MeshBasicMaterial({color: 0x44aa88});
            const bodySegment = new THREE.Mesh(geometry, material);
            const direction = previousPartOfBody.position.clone().sub(bodySegment.position).normalize();
            bodySegment.lookAt(direction);

            this.scene.add(bodySegment);
            bodySegment.position.y = (- this.cylinderHeight) * i;
            bodySegment.position.z = 10;
            previousPartOfBody = bodySegment;

            this.objectOfBody.push(bodySegment);
        }
        
        return Promise.resolve(states.initSnake);
    }

    startGame() {
        this.animationLoop(1);

        return Promise.resolve(states.startGame);
    }

    #vertexShader() {
        return `
          varying vec4 modelViewPosition; 
          varying vec3 mv;
      
          void main() {
            mv = (modelMatrix * vec4(position, 1.0)).xyz;
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
          }
        `;
      }
      
    #fragmentShader() {
        return `
            #ifdef GL_ES
            precision mediump float;
            #endif

            uniform float u_time;
            varying vec3 mv;
      
            void main() {
              vec3 color = vec3(0.0);

              color.x += abs(sin(mv.x * 0.3 * 0.5 )); 
              color.y += abs(sin(mv.y * 0.3 * 0.5 )); 
              color.z += abs(sin(mv.z * 0.3 * 0.5 ));
              
              gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    changeDirection(dir) {
        switch(dir) {
            case "right":
                this.headGroup && (this.headGroup.rotation.z += 0.1 * this.speed);
                break;
            case "left":
                this.headGroup && (this.headGroup.rotation.z -= 0.1 * this.speed);
                break;
        }
    }

    animationLoop(time) {
        if(this.isDestroyed)
            return;
        
        requestAnimationFrame(this.animationLoop);
        
        //Блок с изменением цвета
        let vec = new THREE.Vector3();
        this.head.getWorldDirection(vec);
        
        this.headGroup.position.y += vec.y * this.speed;
        this.headGroup.position.x += vec.x * this.speed;

        this.uniforms.u_time = {type: 'float', value: 80.4};


        this.head.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: this.#fragmentShader(),
            vertexShader: this.#vertexShader(),
        });

        //Блок с изменением положения

        this.renderer.render(this.scene, this.camera);
        this.objectOfBody.forEach((item, index, arr) => {
            if(index === 0)
                return;
            const previous = arr[index - 1];

            let previousPosition = new THREE.Vector3();
            previous.getWorldPosition(previousPosition);
            item.lookAt(previous.position.x, previous.position.y, previous.position.z);
            const direction = previousPosition.clone().sub(item.position).normalize().multiplyScalar(this.cylinderHeight);
            item.position.set(previousPosition.x - direction.x, previousPosition.y - direction.y, previousPosition.z - direction.z);

        })
        
    }

    destroy() {
        this.isDestroyed = true;
    }
}