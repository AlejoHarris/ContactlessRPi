import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';

var socket, container, controls, dragCon, timer, mesh1, mesh2, mesh3, firstTime = true,
    visible = true,
    selected = 0,
    lastLoop = new Date(),
    request = false,
    sign = 1;
var camera, scene, renderer, objects = [],
    dy = [0, 0, 0],
    angle = [0, 0, 0];
var tempz,
    tempy,
    tempx,
    draggin = false,
    finished = false,
    dragged = false;
var inertia = [0, 0, 0],
    dragy = [0, 0, 0],
    rx = 0,
    ry = 0,
    turn = 0,
    touching = false,
    threesixty = 28300,
    jsonC, jsonM, jsonY;

var windowWidth, windowHeight;

var views = [{
        left: 0,
        bottom: 0.2,
        width: 1.0,
        height: 0.8,
        fov: 90,
        background: new THREE.Color(1, 1, 1),

    },
    {
        left: 0,
        top: 0.8,
        width: 0.3,
        height: 0.2,
        fov: 90,
        background: new THREE.Color(0.97, 0.97, 0.97),
    },
    {
        left: 0.3,
        top: 0.8,
        width: 0.4,
        height: 0.2,
        fov: 90,
        background: new THREE.Color(0.97, 0.97, 0.97),
    },
    {
        left: 0.69,
        top: 0.8,
        width: 0.311,
        height: 0.2,
        fov: 90,
        background: new THREE.Color(0.97, 0.97, 0.97),

    },
];


init();
animate();


function init() {

    socket = io.connect('http://contactless.fp:3000');

    $.ajaxSetup({
        cache: false
    });

    $.getJSON("cmy.json", (data) => {
        jsonC = mapOld(data.c, 0, threesixty, 0, 2 * Math.PI);
        jsonM = mapOld(data.m, 0, threesixty, 0, 2 * Math.PI);
        jsonY = mapOld(data.y, 0, threesixty, 0, 2 * Math.PI);

    });

    container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(10, window.devicePixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.25, 100);
    camera.position.set(0, 0, 1.25);
    scene = new THREE.Scene();


    var ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);
    var light = new THREE.SpotLight(0xffffff, 3);

    light.position.set(0, 4, 2);
    light.penumbra = 0;
    light.decay = 1;
    light.distance = 50;
    light.castShadow = true;
    light.angle = 2;

    scene.add(light);

    light.shadow.mapSize.width = 2048 * 4;
    light.shadow.mapSize.height = 2048 * 4;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 200;

    const manager = new THREE.LoadingManager();

    manager.onProgress = function(item, loaded, total) {};

    manager.onLoad = function(item, loaded, total) {
        finished = true;
        checkTurn();

    }

    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('./assets/')
        .load('autoshop_01_1k.hdr', function(texture) {

            texture.repeat.set(1, 1);
            var envMap = pmremGenerator.fromEquirectangular(texture).texture;


            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();

            let texture1 = new THREE.TextureLoader().load('./assets/SVC8/SVC8-C-01.png');
            let texture2 = new THREE.TextureLoader().load('./assets/SVC8/SVC8-M-01.png');
            let texture3 = new THREE.TextureLoader().load('./assets/SVC8/SVC8-Y-01.png');
            texture1.encoding = THREE.sRGBEncoding;
            texture1.flipY = false;
            texture1.center.set(0.45, 0.4);
            texture1.repeat.set(0.7, 0.7);
            texture1.rotation = Math.PI / 2
            texture2.encoding = THREE.sRGBEncoding;
            texture2.flipY = false;
            texture2.center.set(1, 0.5);
            texture2.repeat.set(0.4, 0.4);
            texture3.encoding = THREE.sRGBEncoding;
            texture3.flipY = false;
            texture3.center.set(1, 0.5);
            texture3.repeat.set(0.4, 0.4);
            let material1 = new THREE.MeshPhongMaterial({
                map: texture1,
                specular: 0.5,
                transparent: true,
            });
            let material2 = new THREE.MeshPhongMaterial({
                map: texture2,
                specular: 0.5,
                transparent: true,
            });
            let material3 = new THREE.MeshPhongMaterial({
                map: texture3,
                specular: 0.5,
                transparent: true,
            });


            var geometry1 = new THREE.CylinderBufferGeometry(0.6, 0.6, 0.01, 50);
            var geometry2 = new THREE.CylinderBufferGeometry(0.6, 0.6, 0.008, 50);
            //var geometry3 = new THREE.CylinderBufferGeometry(0.6, 0.6, 0.002, 50);

            mesh1 = new THREE.Mesh(geometry1, material3);
            mesh2 = new THREE.Mesh(geometry1, material2);
            mesh3 = new THREE.Mesh(geometry2, material1);
            //var mesh4 = new THREE.Mesh(geometry3, material4);

            mesh1.rotation.set(Math.PI / 2, jsonY, 0);
            mesh1.position.set(0, 0, -0.02);
            mesh2.rotation.set(Math.PI / 2, jsonM, 0);
            mesh3.rotation.set(Math.PI / 2, jsonC, 0);
            mesh3.position.set(0, 0, 0.02);
            //mesh4.rotation.set(Math.PI / 2, 0, 0);
            mesh1.castShadow = true;
            scene.add(mesh3);
            scene.add(mesh2);
            scene.add(mesh1);

            objects.push(mesh1);
            objects.push(mesh2);
            objects.push(mesh3);

            mesh1.material.blending = THREE.CustomBlending;
            mesh1.material.blendEquation = THREE.AddEquation;
            mesh1.material.blendSrc = THREE.DstColorFactor;
            mesh1.material.blendDst = THREE.OneMinusSrcAlphaFactor;

            mesh2.material.blending = THREE.CustomBlending;
            mesh2.material.blendEquation = THREE.AddEquation;
            mesh2.material.blendSrc = THREE.DstColorFactor;
            mesh2.material.blendDst = THREE.OneMinusSrcAlphaFactor;

            mesh3.material.blending = THREE.CustomBlending;
            mesh3.material.blendEquation = THREE.AddEquation;
            mesh3.material.blendSrc = THREE.DstColorFactor;
            mesh3.material.blendDst = THREE.OneMinusSrcAlphaFactor;

            var loader = new GLTFLoader(manager).setPath('assets/SVC8/');
            loader.load('SVC8.glb', function(gltf) {
                var model = gltf.scene;

                scene.add(model)
            })


        });


    var groundGeo = new THREE.PlaneBufferGeometry(1.5, 1.5);
    var groundMat = new THREE.ShadowMaterial();
    groundMat.opacity = 0.1;

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0;
    ground.position.z = -0.05;
    ground.rotation.z = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    container.appendChild(renderer.domElement);

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();


    window.addEventListener('resize', onWindowResize, false);

    socket.on('turn', function(data) {
        turn = data;
    });

    /*socket.on('db', function(data) {
        jsonC = mapOld(data.c, 0, threesixty, 0, 2 * Math.PI);
        jsonM = mapOld(data.m, 0, threesixty, 0, 2 * Math.PI);
        jsonY = mapOld(data.y, 0, threesixty, 0, 2 * Math.PI);

    });
    */

    window.addEventListener("touchstart", (event) => {
        var cursorX = event.changedTouches[0].pageX;
        var cursorY = event.changedTouches[0].pageY;
        if (cursorY >= window.innerHeight * 0.8) {
            if (cursorX <= window.innerWidth * 0.3) {
                selected = 3;
            } else if (cursorX > window.innerWidth * 0.3 && cursorX <= window.innerWidth * 0.7) {
                selected = 2;
            } else if (cursorX > window.innerWidth * 0.7) {
                selected = 1;
            }
        } else {
            dragged = true;
        }
        rx = cursorX;
        ry = cursorY;
        touching = true;

    });

    window.addEventListener('touchmove', function(event) {

        draggin = true;

        if (selected != 0) {

            var centerY = (window.innerHeight * 0.8) / 2
            var centerX = window.innerWidth / 2;
            var cursorX = event.changedTouches[0].pageX;
            var cursorY = event.changedTouches[0].pageY;

            var angle1;
            var x1 = cursorX - centerX
            var y1 = cursorY - centerY
            var d1 = Math.sqrt((centerY * centerY));
            var d2 = Math.sqrt((x1 * x1 + y1 * y1));
            if (cursorX >= centerX) {
                angle1 = Math.acos((-centerY * y1) / (d1 * d2));
            } else
                angle1 = 2 * Math.PI - Math.acos((-centerY * y1) / (d1 * d2));

            var angle2;
            var x2 = rx - centerX
            var y2 = ry - centerY
            var d3 = Math.sqrt((centerY * centerY));
            var d4 = Math.sqrt((x2 * x2 + y2 * y2));
            if (rx >= centerX) {
                angle2 = Math.acos((-centerY * y2) / (d3 * d4));
            } else
                angle2 = 2 * Math.PI - Math.acos((-centerY * y2) / (d3 * d4));

            var diff = angle2 - angle1;
            if (Math.abs(diff) < Math.PI / 4) {
                objects[selected - 1].rotation.y += diff;
                inertia[selected - 1] = diff * 3
            }

            rx = cursorX;
            ry = cursorY;

        }

    }, false);

    window.addEventListener("touchend", (event) => {
        touching = false;
        draggin = false;
        if (selected != 0) {
            dy[selected - 1] = 0;
        }
    });

    window.addEventListener("visibilitychange", (event) => {
        visible = !visible;
        if (!visible) {
            socket.disconnect();
            var loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('fade-in');
            setTimeout(() => {
                loadingScreen.style.display = 'block';
            }, 1000);
            var overlay = document.getElementById('overlay');
            overlay.style.display = 'block';
        } else {
            $.ajaxSetup({
                cache: false
            });

            $.getJSON("cmy.json", (data) => {
                jsonC = mapOld(data.c, 0, threesixty, 0, 2 * Math.PI);
                jsonM = mapOld(data.m, 0, threesixty, 0, 2 * Math.PI);
                jsonY = mapOld(data.y, 0, threesixty, 0, 2 * Math.PI);

            });
            objects[0].rotation.y = jsonY;
            objects[1].rotation.y = jsonM;
            objects[2].rotation.y = jsonC;

            socket = io.connect('http://contactless.fp:3000');
            var loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
            var overlay = document.getElementById('overlay');
            overlay.style.display = 'none';
        }
    });
}

function checkTurn() {
    if (turn != 0) {
        var loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-in');
        setTimeout(() => {
            loadingScreen.style.display = 'block';
        }, 1000);
        var overlay = document.getElementById('overlay');
        overlay.style.display = 'block';
    } else {
        var loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
        var overlay = document.getElementById('overlay');
        overlay.style.display = 'none';
    }

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePos() {
    if (finished) {
        socket.on('turn', function(data) {
            turn = data;
            checkTurn();
        });

        if (turn == 0) {
            if (dragged) {
                dragged = false;
            }
            if (!dragged) {
                if (selected != 0) {
                    objects.forEach((element, index) => {
                        element.rotation.y = element.rotation.y + inertia[index] / 5;

                        inertia[index] = inertia[index] / 1.15;
                        if (Math.abs(inertia[index]) < 0.00001) {
                            inertia[index] = 0;
                        }
                    });


                }
            }

            var data = {
                y: objects[0].rotation.y,
                m: objects[1].rotation.y,
                c: objects[2].rotation.y,
            }
            socket.emit('data', data);


        } else {

            socket.on('serverData', function(data) {
                objects[0].rotation.y = data.y;
                objects[1].rotation.y = data.m
                objects[2].rotation.y = data.c;
            });
        }
    }
}


function animate() {
    document.getElementById("turn").innerHTML = turn;
    requestAnimationFrame(animate);
    render();
}

function render() {
    if (objects[2] != undefined) {
        updatePos();
        updateSize();
        for (var ii = 0; ii < views.length; ++ii) {

            var view = views[ii];

            switch (ii) {
                case 0:
                    mesh1.visible = true;
                    mesh2.visible = true;
                    mesh3.visible = true;
                    break;
                case 2:
                    mesh1.visible = false;
                    mesh2.visible = true;
                    mesh3.visible = false;
                    break;
                case 3:
                    mesh1.visible = true;
                    mesh2.visible = false;
                    mesh3.visible = false;
                    break;
                case 1:
                    mesh1.visible = false;
                    mesh2.visible = false;
                    mesh3.visible = true;
                    break;
            }

            var left = Math.floor(windowWidth * view.left);
            var bottom = Math.floor(windowHeight * view.bottom);
            var width = Math.floor(windowWidth * view.width);
            var height = Math.floor(windowHeight * view.height);

            renderer.setViewport(left, bottom, width, height);
            renderer.setScissor(left, bottom, width, height);
            renderer.setScissorTest(true);
            renderer.setClearColor(view.background);

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.render(scene, camera);
        }

    }


    camera.lookAt(0, 0, 0.02)

}

function updateSize() {

    if (windowWidth != window.innerWidth || windowHeight != window.innerHeight) {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        renderer.setSize(windowWidth, windowHeight);
    }

}

function mapOld(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}