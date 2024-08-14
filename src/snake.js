import { mutuallyExclusive } from "./mutuallyExclusive";

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
        //this.handleClick = this.handleClick.bind(this);
        this.initScene = this.initScene.bind(this);
        this.initSnake = this.initSnake.bind(this);
        this.changeDirection = this.changeDirection.bind(this);

        //Навешивание обработчиков
        //canvas.addEventListener( 'click', this.handleClick );

    }

    initScene() {

        this.scene.background = new THREE.Color( 'lightblue' );

        this.camera.position.set( 0, 0, 100 );
        //this.camera.up.set( 0, 1, 0 );
        //this.camera.lookAt( 0, 0, 0 );
        this.camera.zoom = 0.01;
        this.camera.updateProjectionMatrix();

        const controls = new OrbitControls( this.camera, this.canvas );
        controls.target.set( 0, 0, 0 );
        controls.update();

        const planeSize = 20;

		const loader = new THREE.TextureLoader();
		const texture = loader.load( '/grass.png' );
        
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		texture.colorSpace = THREE.SRGBColorSpace;
		const repeats = planeSize / 2;
		texture.repeat.set( repeats, repeats);

		const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
		const planeMat = new THREE.MeshPhongMaterial( {
			map: texture,
			side: THREE.DoubleSide,
		} );
		const ground = new THREE.Mesh( planeGeo, planeMat );
		//ground.rotation.x = Math.PI * -.5;
        //ground.position.y = -1000;
        ground.scale.set(10, 10)
		this.scene.add( ground );

        const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.AmbientLight( color, intensity );
		this.scene.add( light );
        

    }

    initSnake({scale, heightOfSnake, speed}) {
        this.speed = speed;
        this.uniforms = {
            u_time:      {type: 'float', value: Date.now()},
        };
        const radiusHead = 5 * scale;
        let geometry = new THREE.SphereGeometry(radiusHead, 15, 15);
        geometry.translate(0, radiusHead, 0);
        //let material =  new THREE.MeshBasicMaterial({color: 0x44aa88});
        
        let material = new THREE.ShaderMaterial({
          uniforms: this.uniforms,
          fragmentShader: this.#fragmentShader(),
          vertexShader: this.#vertexShader(),
        })
        
        let head = new THREE.Mesh(geometry, material);
        this.head = head;
        
        head.position.z = 10 * scale;
        head.position.y = radiusHead * 2;
        
        this.headGroup = head;
        const sphereAxis = new THREE.AxesHelper(20);
        head.add(sphereAxis);

        //head.position.y = radiusHead;
        //headGroup.rotation.z = Math.PI / 2;
        //const sphereAxis = new THREE.AxesHelper(20);
        //headGroup.add(sphereAxis);

        //cube.rotation.y = 1.6 * Math.PI;
        //cube.rotation.x = 1.6 * Math.PI;
        //cube.scale.set(100, 100, 100)

        

        this.scene.add(head);

        let previousPartOfBody = head;
        this.objectOfBody.push(head);

        this.cylinderHeight = 10 * scale;

        for(let i = 0; i < heightOfSnake; i++) {
            const geometry = new THREE.CylinderGeometry(4 * scale, 4 * scale, this.cylinderHeight, 10);
            geometry.translate(0, this.cylinderHeight / 2, 0);
            geometry.rotateX(Math.PI / 2);
            //geometry.rotateZ(Math.PI * 2);
            //geometry.rotateZ(Math.PI * 2);
            

            const material = new THREE.MeshBasicMaterial({color: 0x44aa88});
            const bodySegment = new THREE.Mesh(geometry, material);
            const direction = previousPartOfBody.position.clone().sub(bodySegment.position).normalize();
            bodySegment.lookAt(direction);

            this.scene.add(bodySegment);
            bodySegment.position.y = (- this.cylinderHeight) * i;
            bodySegment.position.z = 10;
            previousPartOfBody = bodySegment;

            this.objectOfBody.push(bodySegment);
            if(i > 0) {
                //bodySegment.rotation.x =  Math.PI * 2;
            }

            if( i === 0) {
                const sphereAxis = new THREE.AxesHelper(20);
                bodySegment.add(sphereAxis);
                //partOfBodyGroup.rotation.x = 1.6 * Math.PI;
                //const direction = head.position.clone().sub(bodySegment.position).normalize();
                
            }
            

        }
        //headGroup.rotation.z =  - Math.PI / 2;
        this.animationLoop(1);
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
        if(mutuallyExclusive[this.direction].includes(dir)){
            return;
        }
        this.direction = dir;
        switch(dir) {
            case "up":
                this.head.rotation.z = Math.PI * 2;
                break;
            case "right":
                this.head.rotation.z = Math.PI * 3 / 2;
                break;
            case "down":
                this.head.rotation.z = Math.PI;
                break;
            case "left":
                this.head.rotation.z = Math.PI / 2;
                break;
        }
    }

    animationLoop(time) {
        if(this.isDestroyed)
            return;
        
        requestAnimationFrame(this.animationLoop);
        
        //Блок с изменением цвета
        // console.log("cos (x): " + Math.cos(this.head.rotation.z * (180 / Math.PI)));
        // console.log("sin (y): " + Math.sin(this.head.rotation.z * (180 / Math.PI)));

        this.uniforms.u_time = {type: 'float', value: 80.4};
        
        //this.head.position.set(this.head.position.x + vec.x * 0.3, this.head.position.y + vec.y * 0.3, 0)
        switch(this.direction) {
            case "up":
                this.head.position.y += this.speed;
                break;
            case "right":
                this.head.position.x += this.speed;
                break;
            case "down":
                this.head.position.y -= this.speed;
                break;
            case "left":
                this.head.position.x -= this.speed;
                break;
        }
        //this.headGroup.position.y += 0.1;

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
            
            item.lookAt(previous.position.x, previous.position.y, previous.position.z);
            const direction = previous.position.clone().sub(item.position).normalize().multiplyScalar(this.cylinderHeight);
            item.position.set(previous.position.x - direction.x, previous.position.y - direction.y, previous.position.z - direction.z);

        })
        
    }

    destroy() {
        this.isDestroyed = true;
    }
}